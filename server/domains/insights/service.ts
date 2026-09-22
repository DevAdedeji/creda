import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/lib/db'
import { business, businessInsightDaily, businessReview, savedBusiness } from '~~/lib/db/schema'
import { insightMetrics, type BusinessInsights, type InsightRange } from '~~/shared/insights'

export async function getBusinessInsights(
  id: string,
  ownerId: string,
  days: InsightRange,
): Promise<BusinessInsights> {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: business.id,
        name: business.name,
        slug: business.slug,
        logoUrl: business.logoUrl,
      })
      .from(business)
      .where(and(eq(business.id, id), eq(business.ownerUserId, ownerId)))
      .limit(1)
      .for('share')
    if (!item) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
    const [clock] = await tx
      .select({
        today: sql<string>`to_char(now() at time zone 'UTC', 'YYYY-MM-DD')`,
        start: sql<string>`to_char((now() at time zone 'UTC')::date - ${days - 1}::integer, 'YYYY-MM-DD')`,
      })
      .from(sql`(select 1) as clock`)
    if (!clock) throw new Error('insights_clock_unavailable')
    const daily = await tx
      .select({
        day: businessInsightDaily.day,
        metric: businessInsightDaily.metric,
        count: businessInsightDaily.count,
      })
      .from(businessInsightDaily)
      .where(
        and(
          eq(businessInsightDaily.businessId, id),
          gte(businessInsightDaily.day, clock.start),
          lte(businessInsightDaily.day, clock.today),
        ),
      )
    const [bookmarks] = await tx
      .select({ total: count() })
      .from(savedBusiness)
      .where(eq(savedBusiness.businessId, id))
    const [reviews] = await tx
      .select({
        total: count(),
        recent:
          sql<number>`count(*) filter (where ${businessReview.createdAt} >= ${clock.start}::date::timestamp at time zone 'UTC' and ${businessReview.createdAt} <= now())`.mapWith(
            Number,
          ),
        average: sql<number | null>`round(avg(${businessReview.rating}), 1)`.mapWith(Number),
      })
      .from(businessReview)
      .where(and(eq(businessReview.businessId, id), eq(businessReview.status, 'published')))
    const metrics = Object.fromEntries(
      insightMetrics.map((metric) => [metric, 0]),
    ) as BusinessInsights['metrics']
    const activity: BusinessInsights['activity'] = []
    const day = new Date(`${clock.start}T00:00:00.000Z`)
    for (let index = 0; index < days; index++) {
      activity.push({ date: day.toISOString().slice(0, 10), views: 0, clicks: 0 })
      day.setUTCDate(day.getUTCDate() + 1)
    }
    for (const row of daily) {
      metrics[row.metric] += row.count
      const point = activity.find((point) => point.date === row.day)
      if (point)
        point[row.metric === 'profile_view' || row.metric === 'bio_view' ? 'views' : 'clicks'] +=
          row.count
    }
    return {
      business: item,
      range: days,
      from: clock.start,
      through: clock.today,
      metrics,
      saves: bookmarks?.total ?? 0,
      newReviews: reviews?.recent ?? 0,
      totalReviews: reviews?.total ?? 0,
      averageRating: reviews?.average ?? null,
      activity,
    }
  })
}
