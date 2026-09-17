import { randomBytes, randomUUID } from 'node:crypto'
import { and, arrayContains, asc, desc, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business, businessModeration, user } from '~~/lib/db/schema'
import type { BusinessListResponse, ManagedBusiness, PublicBusiness } from '~~/shared/businesses'
import type { BusinessListQuery, BusinessReviewInput, BusinessSubmissionInput } from './validation'
import { normalizedKey } from './validation'

const PAGE_SIZE = 12
type BusinessRow = typeof business.$inferSelect

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
    businessTypes: row.businessTypes,
    operationMode: row.operationMode,
    location: row.location,
    googlePlaceId: row.googlePlaceId,
    websiteUrl: row.websiteUrl,
    appStoreUrl: row.appStoreUrl,
    playStoreUrl: row.playStoreUrl,
    socialUrl: row.socialUrl,
    contactUrl: row.contactUrl,
    logoUrl: row.logoUrl,
    ownershipStatus: row.ownershipStatus,
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
): Promise<ManagedBusiness> {
  await ensureNotDuplicate(input)
  try {
    const [created] = await db
      .insert(business)
      .values({
        id: randomUUID(),
        slug: slugFor(input.name, input.location),
        ownerUserId,
        ...input,
        status: 'approved',
        publishedAt: sql`now()`,
        normalizedName: normalizedKey(input.name),
        normalizedLocation: normalizedKey(input.location || 'online'),
      })
      .returning()
    return toManaged(created!)
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
  await ensureNotDuplicate(input, id)

  try {
    return await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(business)
        .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
        .limit(1)
        .for('update')
      if (!locked) throw new BusinessDomainError('not_found', 'Business not found.')
      if (locked.updatedAt.getTime() !== current.updatedAt.getTime()) {
        throw new BusinessDomainError(
          'not_editable',
          'This listing changed. Refresh and try again.',
        )
      }
      const [updated] = await tx
        .update(business)
        .set({
          ...input,
          normalizedName: normalizedKey(input.name),
          normalizedLocation: normalizedKey(input.location || 'online'),
          status: 'approved',
          rejectionReason: null,
          reviewedAt: null,
          reviewedByUserId: null,
          publishedAt: locked.publishedAt ?? sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
        .returning()
      if (locked.status === 'rejected') {
        await tx.insert(businessModeration).values({
          id: randomUUID(),
          businessId: id,
          actorUserId: ownerUserId,
          fromStatus: 'rejected',
          toStatus: 'approved',
          reason: 'Owner updated the listing.',
        })
      }
      return toManaged(updated!)
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new BusinessDomainError('duplicate', 'This business has already been submitted.')
    }
    throw error
  }
}

export async function listOwnedBusinesses(ownerUserId: string): Promise<ManagedBusiness[]> {
  const rows = await db
    .select()
    .from(business)
    .where(eq(business.ownerUserId, ownerUserId))
    .orderBy(desc(business.createdAt))
    .limit(100)
  return rows.map(toManaged)
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
      businessTypes: business.businessTypes,
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
    await tx.insert(businessModeration).values({
      id: randomUUID(),
      businessId: id,
      actorUserId,
      fromStatus: 'pending',
      toStatus: updated.status,
      reason: input.decision === 'reject' ? input.reason : null,
    })
    return toManaged(updated)
  })
}

export async function getPublicBusiness(slug: string): Promise<PublicBusiness | null> {
  const [row] = await db
    .select()
    .from(business)
    .where(and(eq(business.slug, slug), eq(business.status, 'approved')))
    .limit(1)
  return row ? toPublic(row) : null
}

export async function listPublicBusinesses(
  query: BusinessListQuery,
): Promise<BusinessListResponse> {
  const conditions: SQL[] = [eq(business.status, 'approved')]
  if (query.q) {
    const term = '%' + query.q.replace(/[\\%_]/g, '\\$&') + '%'
    conditions.push(or(ilike(business.name, term), ilike(business.description, term))!)
  }
  if (query.category) conditions.push(eq(business.category, query.category))
  if (query.businessType)
    conditions.push(arrayContains(business.businessTypes, [query.businessType]))
  if (query.location) {
    const location = '%' + query.location.replace(/[\\%_]/g, '\\$&') + '%'
    conditions.push(ilike(business.location, location))
  }
  const where = and(...conditions)!
  const rank = query.q
    ? sql<number>`CASE WHEN lower(${business.name}) = ${query.q.toLowerCase()} THEN 0
        WHEN lower(${business.name}) LIKE ${query.q.toLowerCase() + '%'} THEN 1 ELSE 2 END`
    : null

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(business)
      .where(where)
      .orderBy(...(rank ? [rank] : []), asc(business.name), asc(business.id))
      .limit(PAGE_SIZE)
      .offset((query.page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(business)
      .where(where),
  ])

  return {
    items: rows.map(toPublic),
    page: query.page,
    pageSize: PAGE_SIZE,
    total: countRows[0]?.count ?? 0,
  }
}
