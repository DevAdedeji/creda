import { sql, type SQL } from 'drizzle-orm'
import { businessInsightDaily } from '~~/lib/db/schema'
import type { BusinessInsights } from '~~/shared/insights'

const MAX_MONTHLY_POINTS = 24

export function insightActivityBuckets(
  from: string,
  through: string,
): {
  months: number
  expression: SQL<number>
  activity: BusinessInsights['activity']
} {
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${through}T00:00:00Z`)
  const dailyThreshold = new Date(end)
  dailyThreshold.setUTCDate(dailyThreshold.getUTCDate() - 29)
  const monthly = start < dailyThreshold
  const monthCount =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    start.getUTCMonth() +
    1
  const months = monthly ? Math.max(1, Math.ceil(monthCount / MAX_MONTHLY_POINTS)) : 0
  const expression = monthly
    ? sql<number>`floor(((extract(year from ${businessInsightDaily.day})::integer - ${start.getUTCFullYear()}) * 12 + extract(month from ${businessInsightDaily.day})::integer - ${start.getUTCMonth() + 1}) / ${months}::numeric)::integer`
    : sql<number>`(${businessInsightDaily.day} - ${from}::date)`
  const activity: BusinessInsights['activity'] = []
  const cursor = new Date(start)
  if (monthly) cursor.setUTCDate(1)
  while (cursor <= end) {
    const next = new Date(cursor)
    if (monthly) next.setUTCMonth(next.getUTCMonth() + months)
    else next.setUTCDate(next.getUTCDate() + 1)
    const last = new Date(next)
    last.setUTCDate(last.getUTCDate() - 1)
    activity.push({
      date: cursor.toISOString().slice(0, 10),
      through: (last > end ? end : last).toISOString().slice(0, 10),
      views: 0,
      clicks: 0,
    })
    cursor.setTime(next.getTime())
  }
  return { months, expression, activity }
}
