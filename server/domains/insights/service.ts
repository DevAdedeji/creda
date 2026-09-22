import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/lib/db'
import { business, businessInsightDaily, businessReview, savedBusiness } from '~~/lib/db/schema'
import { insightMetrics, type BusinessInsights, type InsightRange } from '~~/shared/insights'
import { insightActivityBuckets } from '@server/domains/insights/activity'

export async function getBusinessInsights(
  id: string,
  ownerId: string,
  days: InsightRange,
): Promise<BusinessInsights> {
  return db.transaction(
    async (tx) => {
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
          start: sql<string>`to_char((now() at time zone 'UTC')::date - ${days === 'all' ? 0 : days - 1}::integer, 'YYYY-MM-DD')`,
        })
        .from(sql`(select 1) as clock`)
      if (!clock) throw new Error('insights_clock_unavailable')
      const dateConditions = and(
        eq(businessInsightDaily.businessId, id),
        days === 'all' ? undefined : gte(businessInsightDaily.day, clock.start),
        lte(businessInsightDaily.day, clock.today),
      )
      const totals = await tx
        .select({
          metric: businessInsightDaily.metric,
          count: sql<number>`sum(${businessInsightDaily.count})`.mapWith(Number),
          firstDay: sql<string>`min(${businessInsightDaily.day})::text`,
        })
        .from(businessInsightDaily)
        .where(dateConditions)
        .groupBy(businessInsightDaily.metric)
      const from =
        days === 'all'
          ? totals.reduce(
              (first, row) => (row.firstDay < first ? row.firstDay : first),
              clock.today,
            )
          : clock.start
      const buckets = insightActivityBuckets(from, clock.today)
      const grouped = await tx
        .select({
          bucket: buckets.expression,
          views:
            sql<number>`sum(case when ${businessInsightDaily.metric} in ('profile_view', 'bio_view') then ${businessInsightDaily.count} else 0 end)`.mapWith(
              Number,
            ),
          clicks:
            sql<number>`sum(case when ${businessInsightDaily.metric} not in ('profile_view', 'bio_view') then ${businessInsightDaily.count} else 0 end)`.mapWith(
              Number,
            ),
        })
        .from(businessInsightDaily)
        .where(dateConditions)
        .groupBy(sql`1`)
        .orderBy(sql`1`)
      const [bookmarks] = await tx
        .select({ total: count() })
        .from(savedBusiness)
        .where(eq(savedBusiness.businessId, id))
      const [reviews] = await tx
        .select({
          total: count(),
          recent: (days === 'all'
            ? sql<number>`count(*)`
            : sql<number>`count(*) filter (where ${businessReview.createdAt} >= (${clock.start}::date::timestamp at time zone 'UTC') and ${businessReview.createdAt} <= now())`
          ).mapWith(Number),
          average: sql<number | null>`round(avg(${businessReview.rating}), 1)`.mapWith(Number),
        })
        .from(businessReview)
        .where(and(eq(businessReview.businessId, id), eq(businessReview.status, 'published')))
      const metrics = Object.fromEntries(
        insightMetrics.map((metric) => [metric, 0]),
      ) as BusinessInsights['metrics']
      for (const row of totals) metrics[row.metric] = row.count
      for (const row of grouped) {
        const point = buckets.activity[row.bucket]
        if (!point) throw new Error('insights_activity_bucket_invalid')
        point.views = row.views
        point.clicks = row.clicks
      }
      return {
        business: item,
        range: days,
        from,
        through: clock.today,
        metrics,
        saves: bookmarks?.total ?? 0,
        newReviews: reviews?.recent ?? 0,
        totalReviews: reviews?.total ?? 0,
        averageRating: reviews?.average ?? null,
        activityBucketMonths: buckets.months,
        activity: buckets.activity,
      }
    },
    { isolationLevel: 'repeatable read' },
  )
}
