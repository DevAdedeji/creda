import { randomUUID } from 'node:crypto'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business, businessReview, reviewModeration, reviewReply, user } from '~~/lib/db/schema'
import type { AdminReview, MyReview, ReviewListResponse } from '~~/shared/reviews'
import type { EditReviewInput, ModerateReviewInput, SubmitReviewInput } from './validation'

const PAGE_SIZE = 5
const DAILY_REVIEW_LIMIT = 10

export class ReviewDomainError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

function toMine(row: typeof businessReview.$inferSelect): MyReview {
  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    experienceMonth: row.experienceMonth,
    status: row.status,
    moderationReason: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listReviews(
  slug: string,
  page: number,
  viewerUserId?: string,
): Promise<ReviewListResponse> {
  const [listing] = await db
    .select({ id: business.id, ownerUserId: business.ownerUserId })
    .from(business)
    .where(and(eq(business.slug, slug), eq(business.status, 'approved')))
    .limit(1)
  if (!listing) throw new ReviewDomainError(404, 'Business not found.')

  const [summary] = await db
    .select({
      count: sql<number>`count(*)::int`,
      average: sql<number | null>`round(avg(${businessReview.rating})::numeric, 1)::float`,
    })
    .from(businessReview)
    .where(and(eq(businessReview.businessId, listing.id), eq(businessReview.status, 'published')))
  const reviewCount = summary?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(reviewCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const rows = await db
    .select({
      id: businessReview.id,
      authorName: user.name,
      rating: businessReview.rating,
      body: businessReview.body,
      experienceMonth: businessReview.experienceMonth,
      createdAt: businessReview.createdAt,
      updatedAt: businessReview.updatedAt,
      replyBody: reviewReply.body,
      replyUpdatedAt: reviewReply.updatedAt,
    })
    .from(businessReview)
    .innerJoin(user, eq(user.id, businessReview.authorUserId))
    .leftJoin(reviewReply, eq(reviewReply.reviewId, businessReview.id))
    .where(and(eq(businessReview.businessId, listing.id), eq(businessReview.status, 'published')))
    .orderBy(desc(businessReview.createdAt), desc(businessReview.id))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE)

  let myReview: MyReview | null = null
  if (viewerUserId) {
    const [mine] = await db
      .select()
      .from(businessReview)
      .where(
        and(
          eq(businessReview.businessId, listing.id),
          eq(businessReview.authorUserId, viewerUserId),
        ),
      )
      .limit(1)
    if (mine && mine.status !== 'removed') {
      myReview = toMine(mine)
      if (mine.status === 'rejected') {
        const [decision] = await db
          .select({ reason: reviewModeration.reason })
          .from(reviewModeration)
          .where(
            and(eq(reviewModeration.reviewId, mine.id), eq(reviewModeration.toStatus, 'rejected')),
          )
          .orderBy(desc(reviewModeration.createdAt))
          .limit(1)
        myReview.moderationReason = decision?.reason ?? null
      }
    }
  }

  return {
    averageRating: summary?.average ?? null,
    reviewCount,
    reviews: rows.map((row) => ({
      id: row.id,
      authorName: row.authorName,
      rating: row.rating,
      body: row.body,
      experienceMonth: row.experienceMonth,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      reply:
        row.replyBody && row.replyUpdatedAt
          ? { body: row.replyBody, updatedAt: row.replyUpdatedAt.toISOString() }
          : null,
    })),
    page: safePage,
    totalPages,
    myReview,
    canReview: Boolean(viewerUserId && viewerUserId !== listing.ownerUserId),
    isOwner: viewerUserId === listing.ownerUserId,
  }
}

export async function submitReview(
  authorUserId: string,
  input: SubmitReviewInput,
): Promise<MyReview> {
  return db.transaction(async (tx) => {
    // Lock the account to serialize the per-author daily cap across simultaneous requests.
    const [author] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, authorUserId))
      .for('update')
    if (!author) throw new ReviewDomainError(401, 'Sign in to continue.')
    const [listing] = await tx
      .select({ id: business.id, ownerUserId: business.ownerUserId })
      .from(business)
      .where(and(eq(business.id, input.businessId), eq(business.status, 'approved')))
      .limit(1)
    if (!listing) throw new ReviewDomainError(404, 'Business not found.')
    if (listing.ownerUserId === authorUserId) {
      throw new ReviewDomainError(403, 'You cannot review your own business.')
    }

    const [existing] = await tx
      .select()
      .from(businessReview)
      .where(
        and(
          eq(businessReview.businessId, input.businessId),
          eq(businessReview.authorUserId, authorUserId),
        ),
      )
      .for('update')
    if (existing && existing.status !== 'removed') {
      throw new ReviewDomainError(
        409,
        'You have already reviewed this business. Edit your review instead.',
      )
    }

    const [daily] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(businessReview)
      .where(
        and(
          eq(businessReview.authorUserId, authorUserId),
          gte(businessReview.createdAt, sql`now() - interval '24 hours'`),
        ),
      )
    if ((daily?.count ?? 0) >= DAILY_REVIEW_LIMIT) {
      throw new ReviewDomainError(429, 'You can submit up to 10 new reviews in 24 hours.')
    }
    if (existing && existing.updatedAt > new Date(Date.now() - 60_000)) {
      throw new ReviewDomainError(429, 'Please wait a minute before submitting this review again.')
    }

    if (existing) {
      await tx.delete(reviewReply).where(eq(reviewReply.reviewId, existing.id))
      const [row] = await tx
        .update(businessReview)
        .set({ ...input, status: 'pending', updatedAt: sql`now()` })
        .where(eq(businessReview.id, existing.id))
        .returning()
      return toMine(row!)
    }
    const [row] = await tx
      .insert(businessReview)
      .values({ id: randomUUID(), ...input, authorUserId, status: 'pending' })
      .returning()
    return toMine(row!)
  })
}

export async function editReview(
  id: string,
  authorUserId: string,
  input: EditReviewInput,
): Promise<MyReview> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(businessReview)
      .where(and(eq(businessReview.id, id), eq(businessReview.authorUserId, authorUserId)))
      .for('update')
    if (!current || current.status === 'removed')
      throw new ReviewDomainError(404, 'Review not found.')
    if (
      current.rating === input.rating &&
      current.body === input.body &&
      current.experienceMonth === input.experienceMonth
    ) {
      return toMine(current)
    }
    await tx.delete(reviewReply).where(eq(reviewReply.reviewId, id))
    const [updated] = await tx
      .update(businessReview)
      .set({ ...input, status: 'pending', updatedAt: sql`now()` })
      .where(eq(businessReview.id, id))
      .returning()
    return toMine(updated!)
  })
}

export async function deleteReview(id: string, authorUserId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(businessReview)
      .where(and(eq(businessReview.id, id), eq(businessReview.authorUserId, authorUserId)))
      .for('update')
    if (!current || current.status === 'removed')
      throw new ReviewDomainError(404, 'Review not found.')
    await tx
      .update(businessReview)
      .set({ status: 'removed', updatedAt: sql`now()` })
      .where(eq(businessReview.id, id))
    await tx.insert(reviewModeration).values({
      id: randomUUID(),
      reviewId: id,
      actorUserId: authorUserId,
      fromStatus: current.status,
      toStatus: 'removed',
      reason: 'Author removed their review.',
    })
  })
}

export async function saveOwnerReply(
  reviewId: string,
  ownerUserId: string,
  body: string,
): Promise<{ body: string; updatedAt: string }> {
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select({
        id: businessReview.id,
        status: businessReview.status,
        ownerUserId: business.ownerUserId,
      })
      .from(businessReview)
      .innerJoin(business, eq(business.id, businessReview.businessId))
      .where(eq(businessReview.id, reviewId))
      .for('update')
    if (!target || target.status !== 'published')
      throw new ReviewDomainError(404, 'Published review not found.')
    if (target.ownerUserId !== ownerUserId)
      throw new ReviewDomainError(403, 'Only this business owner can reply.')
    const [reply] = await tx
      .insert(reviewReply)
      .values({ id: randomUUID(), reviewId, ownerUserId, body })
      .onConflictDoUpdate({
        target: reviewReply.reviewId,
        set: { body, updatedAt: sql`now()` },
      })
      .returning()
    return { body: reply!.body, updatedAt: reply!.updatedAt.toISOString() }
  })
}

export async function listAdminReviews(
  page: number,
  status: 'pending' | 'published' | 'rejected' | 'removed',
): Promise<{
  reviews: AdminReview[]
  page: number
  totalPages: number
}> {
  const [summary] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessReview)
    .where(eq(businessReview.status, status))
  const totalPages = Math.max(1, Math.ceil((summary?.count ?? 0) / 20))
  const safePage = Math.min(page, totalPages)
  const rows = await db
    .select({
      id: businessReview.id,
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      authorName: user.name,
      rating: businessReview.rating,
      body: businessReview.body,
      experienceMonth: businessReview.experienceMonth,
      status: businessReview.status,
      createdAt: businessReview.createdAt,
      updatedAt: businessReview.updatedAt,
    })
    .from(businessReview)
    .innerJoin(business, eq(business.id, businessReview.businessId))
    .innerJoin(user, eq(user.id, businessReview.authorUserId))
    .where(eq(businessReview.status, status))
    .orderBy(desc(businessReview.updatedAt), desc(businessReview.id))
    .limit(20)
    .offset((safePage - 1) * 20)
  return {
    reviews: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    page: safePage,
    totalPages,
  }
}

export async function moderateReview(
  id: string,
  actorUserId: string,
  input: ModerateReviewInput,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(businessReview)
      .where(eq(businessReview.id, id))
      .for('update')
    if (!current) throw new ReviewDomainError(404, 'Review not found.')
    const nextStatus =
      input.decision === 'publish'
        ? 'published'
        : input.decision === 'reject'
          ? 'rejected'
          : 'removed'
    const allowed =
      (current.status === 'pending' && nextStatus !== 'removed') ||
      (current.status === 'published' && nextStatus === 'removed')
    if (!allowed)
      throw new ReviewDomainError(409, 'This review is no longer awaiting that decision.')
    await tx
      .update(businessReview)
      .set({ status: nextStatus, updatedAt: sql`now()` })
      .where(eq(businessReview.id, id))
    await tx.insert(reviewModeration).values({
      id: randomUUID(),
      reviewId: id,
      actorUserId,
      fromStatus: current.status,
      toStatus: nextStatus,
      reason: input.decision === 'publish' ? null : input.reason,
    })
  })
}
