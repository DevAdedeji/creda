import { randomBytes, randomUUID } from 'node:crypto'
import { and, asc, desc, eq, ilike, inArray, isNull, ne, or, sql, type SQL } from 'drizzle-orm'
import { db } from '~~/lib/db'
import {
  queueBusinessCreated,
  queueBusinessDecision,
  queueOwnershipDecisions,
} from '@server/domains/notifications/business'
import {
  business,
  businessSlug,
  businessImageUpload,
  businessModeration,
  businessReview,
  savedBusiness,
  ownershipDecision,
  ownershipRequest,
  user,
} from '~~/lib/db/schema'
import type {
  BusinessCreationResponse,
  BusinessListResponse,
  ManagedBusiness,
  ManagedBusinessListResponse,
  PublicBusiness,
} from '~~/shared/businesses'
import type { BusinessListQuery, BusinessReviewInput, BusinessSubmissionInput } from './validation'
import { normalizedKey } from './validation'
import { validateBusinessMedia } from './media'
import { deleteUnusedBusinessImages } from './image-storage'

const PAGE_SIZE = 12
const MANAGED_PAGE_SIZE = 10
type BusinessRow = typeof business.$inferSelect
type BusinessTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

function imageUrls(value: {
  logoUrl: string | null
  coverUrl: string | null
  galleryUrls: string[]
}) {
  return [
    ...new Set(
      [value.logoUrl, value.coverUrl, ...value.galleryUrls].filter((url): url is string =>
        Boolean(url),
      ),
    ),
  ].sort()
}

async function assertAttachableImages(
  tx: BusinessTransaction,
  ownerUserId: string,
  input: BusinessSubmissionInput,
) {
  for (const url of imageUrls(input)) {
    const [image] = await tx
      .select()
      .from(businessImageUpload)
      .where(eq(businessImageUpload.url, url))
      .for('update')
    if (image && (image.ownerUserId !== ownerUserId || image.status !== 'ready')) {
      throw new BusinessDomainError(
        'not_editable',
        'An image is no longer available. Upload it again.',
      )
    }
  }
}

export class BusinessDomainError extends Error {
  constructor(
    readonly code: 'duplicate' | 'not_found' | 'not_editable' | 'not_pending',
    message: string,
  ) {
    super(message)
  }
}

function isUniqueViolation(error: unknown): boolean {
  let current = error
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== 'object') return false
    if ('code' in current && current.code === '23505') return true
    current = 'cause' in current ? current.cause : null
  }
  return false
}

function slugFor(name: string, location: string | null): string {
  const base = (name + ' ' + (location || 'online'))
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
  return (base || 'business') + '-' + randomBytes(3).toString('hex')
}

function toPublic(row: BusinessRow): PublicBusiness {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    operationMode: row.operationMode,
    location: row.location,
    city: row.city,
    state: row.state,
    serviceArea: row.serviceArea,
    openingHours: row.openingHours,
    weeklyHours: row.weeklyHours,
    hoursTimeZone: row.hoursTimeZone,
    services: row.services,
    googlePlaceId: row.googlePlaceId,
    websiteUrl: row.websiteUrl,
    appStoreUrl: row.appStoreUrl,
    playStoreUrl: row.playStoreUrl,
    socialUrl: row.socialUrl,
    contactUrl: row.contactUrl,
    logoUrl: row.logoUrl,
    coverUrl: row.coverUrl,
    galleryUrls: row.galleryUrls,
    ownershipStatus: row.ownershipStatus,
    listingSource: row.listingSource,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }
}

function toManaged(row: BusinessRow): ManagedBusiness {
  return {
    ...toPublic(row),
    status: row.status,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function duplicateFilter(input: BusinessSubmissionInput, exceptId?: string): SQL {
  const links = [
    input.websiteUrl,
    input.appStoreUrl,
    input.playStoreUrl,
    input.socialUrl,
    input.contactUrl,
  ].filter((value): value is string => Boolean(value))
  const conditions: SQL[] = [
    and(
      eq(business.normalizedName, normalizedKey(input.name)),
      eq(business.normalizedLocation, normalizedKey(input.location || 'online')),
    )!,
  ]
  for (const link of links) {
    conditions.push(
      eq(business.websiteUrl, link),
      eq(business.appStoreUrl, link),
      eq(business.playStoreUrl, link),
      eq(business.socialUrl, link),
      eq(business.contactUrl, link),
    )
  }
  const match = or(...conditions)!
  return exceptId ? and(ne(business.id, exceptId), match)! : match
}

async function ensureNotDuplicate(
  input: BusinessSubmissionInput,
  exceptId?: string,
): Promise<void> {
  const [existing] = await db
    .select({ id: business.id })
    .from(business)
    .where(duplicateFilter(input, exceptId))
    .limit(1)
  if (existing) {
    throw new BusinessDomainError(
      'duplicate',
      'A business with this name and location or destination link has already been submitted.',
    )
  }
}

export async function createBusiness(
  ownerUserId: string,
  input: BusinessSubmissionInput,
): Promise<BusinessCreationResponse> {
  validateBusinessMedia(ownerUserId, input)
  await ensureNotDuplicate(input)
  const { mediaProofs: _mediaProofs, ...details } = input
  try {
    const created = await db.transaction(async (tx) => {
      // Serialize this owner's creations so only one listing can be their first.
      await tx.select({ id: user.id }).from(user).where(eq(user.id, ownerUserId)).for('update')
      const [existingBusiness] = await tx
        .select({ id: business.id })
        .from(business)
        .where(eq(business.ownerUserId, ownerUserId))
        .limit(1)
      await assertAttachableImages(tx, ownerUserId, input)
      const [row] = await tx
        .insert(business)
        .values({
          id: randomUUID(),
          slug: slugFor(input.name, input.location),
          ownerUserId,
          businessTypes: [],
          ...details,
          status: 'approved',
          publishedAt: sql`now()`,
          normalizedName: normalizedKey(input.name),
          normalizedLocation: normalizedKey(input.location || 'online'),
        })
        .returning()
      await tx.insert(businessSlug).values({ slug: row!.slug, businessId: row!.id })
      await queueBusinessCreated(tx, row!)
      return { row: row!, isFirstBusiness: !existingBusiness }
    })
    return { ...toManaged(created.row), isFirstBusiness: created.isFirstBusiness }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new BusinessDomainError('duplicate', 'This business has already been submitted.')
    }
    throw error
  }
}

export async function updateBusiness(
  id: string,
  ownerUserId: string,
  input: BusinessSubmissionInput,
): Promise<ManagedBusiness> {
  const [current] = await db
    .select()
    .from(business)
    .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
    .limit(1)
  if (!current) throw new BusinessDomainError('not_found', 'Business not found.')
  validateBusinessMedia(ownerUserId, input, current)
  await ensureNotDuplicate(input, id)
  const { mediaProofs: _mediaProofs, ...details } = input

  try {
    const result = await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(business)
        .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
        .limit(1)
        .for('update')
      if (!locked) throw new BusinessDomainError('not_found', 'Business not found.')
      if (locked.status === 'suspended') {
        throw new BusinessDomainError(
          'not_editable',
          'This listing is unavailable while it is under review.',
        )
      }
      if (locked.updatedAt.getTime() !== current.updatedAt.getTime()) {
        throw new BusinessDomainError(
          'not_editable',
          'This listing changed. Refresh and try again.',
        )
      }
      const identityChanged =
        locked.ownershipStatus === 'verified' &&
        (locked.normalizedName !== normalizedKey(input.name) ||
          locked.normalizedLocation !== normalizedKey(input.location || 'online') ||
          locked.googlePlaceId !== input.googlePlaceId ||
          locked.operationMode !== input.operationMode ||
          locked.websiteUrl !== input.websiteUrl ||
          locked.appStoreUrl !== input.appStoreUrl ||
          locked.playStoreUrl !== input.playStoreUrl ||
          locked.socialUrl !== input.socialUrl ||
          locked.contactUrl !== input.contactUrl)
      await assertAttachableImages(tx, ownerUserId, input)
      const [updated] = await tx
        .update(business)
        .set({
          ...details,
          normalizedName: normalizedKey(input.name),
          normalizedLocation: normalizedKey(input.location || 'online'),
          status: 'approved',
          ownershipStatus: identityChanged ? 'revoked' : locked.ownershipStatus,
          rejectionReason: null,
          reviewedAt: null,
          reviewedByUserId: null,
          publishedAt: locked.publishedAt ?? sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
        .returning()
      if (identityChanged) {
        const approvedRequests = await tx
          .select({ id: ownershipRequest.id, requesterUserId: ownershipRequest.requesterUserId })
          .from(ownershipRequest)
          .where(and(eq(ownershipRequest.businessId, id), eq(ownershipRequest.status, 'approved')))
        const notifications = []
        for (const request of approvedRequests) {
          const decisionId = randomUUID()
          await tx
            .update(ownershipRequest)
            .set({
              status: 'revoked',
              reviewNote: 'Listing identity or official contact details changed.',
              reviewedByUserId: ownerUserId,
              reviewedAt: sql`now()`,
              updatedAt: sql`now()`,
            })
            .where(eq(ownershipRequest.id, request.id))
          await tx.insert(ownershipDecision).values({
            id: decisionId,
            requestId: request.id,
            businessId: id,
            actorUserId: ownerUserId,
            fromStatus: 'approved',
            toStatus: 'revoked',
            reason: 'Listing identity or official contact details changed.',
          })
          notifications.push({
            eventId: decisionId,
            requesterUserId: request.requesterUserId,
            status: 'revoked' as const,
            reason:
              'Listing identity or official contact details changed. You can request verification again from your account.',
          })
        }
        await queueOwnershipDecisions(tx, updated!, notifications)
      }
      if (locked.status === 'rejected') {
        const decisionId = randomUUID()
        await tx.insert(businessModeration).values({
          id: decisionId,
          businessId: id,
          actorUserId: ownerUserId,
          fromStatus: 'rejected',
          toStatus: 'approved',
          reason: 'Owner updated the listing.',
        })
        await queueBusinessDecision(tx, updated!, {
          eventId: decisionId,
          status: 'restored',
          reason: 'Your updated listing has been published.',
        })
      }
      const selected = new Set(imageUrls(input))
      const removed = imageUrls(locked).filter((url) => !selected.has(url))
      for (const url of removed) {
        await tx
          .update(businessImageUpload)
          .set({ deleteAfter: new Date() })
          .where(and(eq(businessImageUpload.url, url), eq(businessImageUpload.status, 'ready')))
      }
      return { managed: toManaged(updated!), removed }
    })
    try {
      await deleteUnusedBusinessImages(result.removed)
    } catch (error) {
      console.error('Business image cleanup was queued for retry:', error)
    }
    return result.managed
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new BusinessDomainError('duplicate', 'This business has already been submitted.')
    }
    throw error
  }
}

export async function listOwnedBusinesses(
  ownerUserId: string,
  requestedPage: number,
): Promise<ManagedBusinessListResponse> {
  const where = eq(business.ownerUserId, ownerUserId)
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(business)
    .where(where)
  const total = countRow?.count ?? 0
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / MANAGED_PAGE_SIZE)))
  const rows = await db
    .select()
    .from(business)
    .where(where)
    .orderBy(desc(business.createdAt), desc(business.id))
    .limit(MANAGED_PAGE_SIZE)
    .offset((page - 1) * MANAGED_PAGE_SIZE)
  return { items: rows.map(toManaged), page, pageSize: MANAGED_PAGE_SIZE, total }
}

export async function getOwnedBusiness(
  id: string,
  ownerUserId: string,
): Promise<ManagedBusiness | null> {
  const [row] = await db
    .select()
    .from(business)
    .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
    .limit(1)
  return row ? toManaged(row) : null
}

export async function listPendingBusinesses() {
  return db
    .select({
      id: business.id,
      slug: business.slug,
      name: business.name,
      description: business.description,
      category: business.category,
      operationMode: business.operationMode,
      location: business.location,
      googlePlaceId: business.googlePlaceId,
      websiteUrl: business.websiteUrl,
      appStoreUrl: business.appStoreUrl,
      playStoreUrl: business.playStoreUrl,
      socialUrl: business.socialUrl,
      contactUrl: business.contactUrl,
      logoUrl: business.logoUrl,
      createdAt: business.createdAt,
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(business)
    .innerJoin(user, eq(business.ownerUserId, user.id))
    .where(eq(business.status, 'pending'))
    .orderBy(asc(business.createdAt))
    .limit(100)
}

export async function reviewBusiness(
  id: string,
  actorUserId: string,
  input: BusinessReviewInput,
): Promise<ManagedBusiness> {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(business)
      .set({
        status: input.decision === 'approve' ? 'approved' : 'rejected',
        rejectionReason: input.decision === 'reject' ? input.reason : null,
        reviewedByUserId: actorUserId,
        reviewedAt: sql`now()`,
        publishedAt: input.decision === 'approve' ? sql`now()` : null,
        updatedAt: sql`now()`,
      })
      .where(and(eq(business.id, id), eq(business.status, 'pending')))
      .returning()
    if (!updated) {
      const [existing] = await tx
        .select({ id: business.id })
        .from(business)
        .where(eq(business.id, id))
      throw new BusinessDomainError(
        existing ? 'not_pending' : 'not_found',
        existing ? 'This listing has already been reviewed.' : 'Business not found.',
      )
    }
    const decisionId = randomUUID()
    await tx.insert(businessModeration).values({
      id: decisionId,
      businessId: id,
      actorUserId,
      fromStatus: 'pending',
      toStatus: updated.status,
      reason: input.decision === 'reject' ? input.reason : null,
    })
    await queueBusinessDecision(tx, updated, {
      eventId: decisionId,
      status: input.decision === 'approve' ? 'approved' : 'rejected',
      reason: input.decision === 'reject' ? input.reason : null,
    })
    return toManaged(updated)
  })
}

export async function getPublicBusiness(slug: string): Promise<PublicBusiness | null> {
  const [current] = await db
    .select()
    .from(business)
    .where(and(eq(business.slug, slug), eq(business.status, 'approved')))
    .limit(1)
  if (current) return toPublic(current)

  const [row] = await db
    .select({ business })
    .from(businessSlug)
    .innerJoin(business, eq(businessSlug.businessId, business.id))
    .where(and(eq(businessSlug.slug, slug), eq(business.status, 'approved')))
    .limit(1)
  return row ? toPublic(row.business) : null
}

export async function updateBusinessSlug(
  id: string,
  ownerUserId: string,
  slug: string,
): Promise<ManagedBusiness> {
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(business)
        .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
        .limit(1)
        .for('update')
      if (!current) throw new BusinessDomainError('not_found', 'Business not found.')
      if (current.status === 'suspended') {
        throw new BusinessDomainError(
          'not_editable',
          'This listing is unavailable while it is under review.',
        )
      }
      if (current.slug === slug) return toManaged(current)

      // A listing made by an older app instance during deployment may not be backfilled yet.
      const [previous] = await tx
        .select({ businessId: businessSlug.businessId })
        .from(businessSlug)
        .where(eq(businessSlug.slug, current.slug))
        .limit(1)
      if (previous && previous.businessId !== id) {
        throw new BusinessDomainError('duplicate', 'This business link is already in use.')
      }
      if (!previous) await tx.insert(businessSlug).values({ slug: current.slug, businessId: id })

      const [claimed] = await tx
        .select({ businessId: businessSlug.businessId })
        .from(businessSlug)
        .where(eq(businessSlug.slug, slug))
        .limit(1)
      if (claimed && claimed.businessId !== id) {
        throw new BusinessDomainError('duplicate', 'This link is already taken.')
      }
      if (!claimed) await tx.insert(businessSlug).values({ slug, businessId: id })
      const [updated] = await tx
        .update(business)
        .set({ slug, updatedAt: sql`now()` })
        .where(eq(business.id, id))
        .returning()
      return toManaged(updated!)
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new BusinessDomainError('duplicate', 'This link is already taken.')
    }
    throw error
  }
}

export async function listPublicBusinesses(
  query: BusinessListQuery,
  additionalConditions: SQL[] = [],
): Promise<BusinessListResponse> {
  const conditions: SQL[] = [eq(business.status, 'approved'), ...additionalConditions]
  if (query.q) {
    const term = '%' + query.q.replace(/[\\%_]/g, '\\$&') + '%'
    conditions.push(or(ilike(business.name, term), ilike(business.description, term))!)
  }
  if (query.category.length) conditions.push(inArray(business.category, query.category))
  if (query.location) {
    const location = '%' + query.location.replace(/[\\%_]/g, '\\$&') + '%'
    conditions.push(ilike(business.location, location))
  }
  if (query.city) {
    const city = `%${query.city.replace(/[\\%_]/g, '\\$&')}%`
    conditions.push(
      or(ilike(business.city, city), and(isNull(business.city), ilike(business.location, city)))!,
    )
  }
  if (query.state) {
    const state = `%${query.state.replace(/\s+state$/i, '').replace(/[\\%_]/g, '\\$&')}%`
    conditions.push(
      or(
        ilike(business.state, state),
        and(isNull(business.state), ilike(business.location, state)),
      )!,
    )
  }
  if (query.operationMode.length)
    conditions.push(inArray(business.operationMode, query.operationMode))
  const where = and(...conditions)!
  const rank = query.q
    ? sql<number>`CASE WHEN lower(${business.name}) = ${query.q.toLowerCase()} THEN 0
        WHEN lower(${business.name}) LIKE ${query.q.toLowerCase() + '%'} THEN 1 ELSE 2 END`
    : null
  const reviewCount = sql<number>`(select count(*) from business_review r where r.business_id = ${business.id} and r.status = 'published')`
  const averageRating = sql<number>`(select avg(r.rating) from business_review r where r.business_id = ${business.id} and r.status = 'published')`
  const ordering =
    query.sort === 'top_rated'
      ? [
          sql`${averageRating} desc nulls last`,
          desc(reviewCount),
          asc(business.name),
          asc(business.id),
        ]
      : query.sort === 'most_reviewed'
        ? [
            desc(reviewCount),
            sql`${averageRating} desc nulls last`,
            asc(business.name),
            asc(business.id),
          ]
        : query.sort === 'newest'
          ? [desc(business.publishedAt), desc(business.createdAt), asc(business.id)]
          : [...(rank ? [rank] : []), asc(business.name), asc(business.id)]

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(business)
      .where(where)
      .orderBy(...ordering)
      .limit(PAGE_SIZE)
      .offset((query.page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(business)
      .where(where),
  ])

  const ratings = rows.length
    ? await db
        .select({
          businessId: businessReview.businessId,
          reviewCount: sql<number>`count(*)::int`,
          averageRating: sql<number>`round(avg(${businessReview.rating})::numeric, 1)::float`,
        })
        .from(businessReview)
        .where(
          and(
            inArray(
              businessReview.businessId,
              rows.map((row) => row.id),
            ),
            eq(businessReview.status, 'published'),
          ),
        )
        .groupBy(businessReview.businessId)
    : []
  const ratingsByBusiness = new Map(ratings.map((rating) => [rating.businessId, rating]))

  return {
    items: rows.map((row) => ({
      ...toPublic(row),
      averageRating: ratingsByBusiness.get(row.id)?.averageRating ?? null,
      reviewCount: ratingsByBusiness.get(row.id)?.reviewCount ?? 0,
    })),
    page: query.page,
    pageSize: PAGE_SIZE,
    total: countRows[0]?.count ?? 0,
  }
}

export async function listSavedBusinesses(userId: string, page: number) {
  const where = and(eq(savedBusiness.userId, userId), eq(business.status, 'approved'))!
  const [rows, counts] = await Promise.all([
    db
      .select({ listing: business, savedAt: savedBusiness.createdAt })
      .from(savedBusiness)
      .innerJoin(business, eq(savedBusiness.businessId, business.id))
      .where(where)
      .orderBy(desc(savedBusiness.createdAt), desc(savedBusiness.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(savedBusiness)
      .innerJoin(business, eq(savedBusiness.businessId, business.id))
      .where(where),
  ])
  const ratings = rows.length
    ? await db
        .select({
          businessId: businessReview.businessId,
          reviewCount: sql<number>`count(*)::int`,
          averageRating: sql<number>`round(avg(${businessReview.rating})::numeric, 1)::float`,
        })
        .from(businessReview)
        .where(
          and(
            inArray(
              businessReview.businessId,
              rows.map((row) => row.listing.id),
            ),
            eq(businessReview.status, 'published'),
          ),
        )
        .groupBy(businessReview.businessId)
    : []
  const byBusiness = new Map(ratings.map((item) => [item.businessId, item]))
  return {
    items: rows.map(({ listing, savedAt }) => ({
      ...toPublic(listing),
      savedAt: savedAt.toISOString(),
      averageRating: byBusiness.get(listing.id)?.averageRating ?? null,
      reviewCount: byBusiness.get(listing.id)?.reviewCount ?? 0,
    })),
    page,
    pageSize: PAGE_SIZE,
    total: counts[0]?.count ?? 0,
  }
}

export async function isBusinessSaved(userId: string, businessId: string) {
  const [row] = await db
    .select({ id: savedBusiness.id })
    .from(savedBusiness)
    .where(and(eq(savedBusiness.userId, userId), eq(savedBusiness.businessId, businessId)))
    .limit(1)
  return Boolean(row)
}

export async function listSavedBusinessIds(
  userId: string,
  businessIds: string[],
): Promise<string[]> {
  if (!businessIds.length) return []
  const rows = await db
    .select({ businessId: savedBusiness.businessId })
    .from(savedBusiness)
    .where(and(eq(savedBusiness.userId, userId), inArray(savedBusiness.businessId, businessIds)))
  return rows.map((row) => row.businessId)
}

export async function saveBusiness(userId: string, businessId: string) {
  const [listing] = await db
    .select({ id: business.id })
    .from(business)
    .where(and(eq(business.id, businessId), eq(business.status, 'approved')))
    .limit(1)
  if (!listing) throw new BusinessDomainError('not_found', 'Business not found.')
  await db
    .insert(savedBusiness)
    .values({ id: randomUUID(), userId, businessId })
    .onConflictDoNothing()
}

export async function unsaveBusiness(userId: string, businessId: string) {
  await db
    .delete(savedBusiness)
    .where(and(eq(savedBusiness.userId, userId), eq(savedBusiness.businessId, businessId)))
}
