import { randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/lib/db'
import { business, businessReview, reviewVote } from '~~/lib/db/schema'
import type { ReviewVoteSummary, ReviewVoteValue } from '~~/shared/reviews'

const voteCounts = {
  usefulCount: sql<number>`count(*) FILTER (WHERE ${reviewVote.value} = 'useful')::int`,
  notUsefulCount: sql<number>`count(*) FILTER (WHERE ${reviewVote.value} = 'not_useful')::int`,
}

export async function listReviewVotes(
  reviewIds: string[],
  viewerUserId?: string,
): Promise<Map<string, ReviewVoteSummary>> {
  if (!reviewIds.length) return new Map()
  const rows = await db
    .select({
      reviewId: reviewVote.reviewId,
      ...voteCounts,
      myVote: sql<ReviewVoteValue | null>`max(CASE WHEN ${reviewVote.voterUserId} = ${viewerUserId ?? null} THEN ${reviewVote.value} END)`,
    })
    .from(reviewVote)
    .where(inArray(reviewVote.reviewId, reviewIds))
    .groupBy(reviewVote.reviewId)
  return new Map(rows.map(({ reviewId, ...summary }) => [reviewId, summary]))
}

export async function setReviewVote(
  reviewId: string,
  voterUserId: string,
  vote: ReviewVoteValue | null,
): Promise<ReviewVoteSummary> {
  return db.transaction(async (tx) => {
    // Serialize votes with review edits/removal so votes cannot survive a content reset.
    const [review] = await tx
      .select({
        authorUserId: businessReview.authorUserId,
        businessId: businessReview.businessId,
        status: businessReview.status,
      })
      .from(businessReview)
      .where(eq(businessReview.id, reviewId))
      .for('update')
    if (!review || review.status !== 'published')
      throw createError({ statusCode: 404, statusMessage: 'Review not found.' })
    const [listing] = await tx
      .select({ id: business.id })
      .from(business)
      .where(and(eq(business.id, review.businessId), eq(business.status, 'approved')))
      .limit(1)
    if (!listing) throw createError({ statusCode: 404, statusMessage: 'Review not found.' })
    if (review.authorUserId === voterUserId)
      throw createError({ statusCode: 403, statusMessage: 'You cannot vote on your own review.' })

    if (vote === null) {
      await tx
        .delete(reviewVote)
        .where(and(eq(reviewVote.reviewId, reviewId), eq(reviewVote.voterUserId, voterUserId)))
    } else {
      await tx
        .insert(reviewVote)
        .values({ id: randomUUID(), reviewId, voterUserId, value: vote })
        .onConflictDoUpdate({
          target: [reviewVote.reviewId, reviewVote.voterUserId],
          set: { value: vote, updatedAt: sql`now()` },
        })
    }
    const [counts] = await tx
      .select(voteCounts)
      .from(reviewVote)
      .where(eq(reviewVote.reviewId, reviewId))
    return {
      usefulCount: counts!.usefulCount,
      notUsefulCount: counts!.notUsefulCount,
      myVote: vote,
    }
  })
}
