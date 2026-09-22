import { createHmac, randomUUID } from 'node:crypto'
import { and, eq, inArray, lt, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business, businessInsightDaily, businessInsightGuard } from '~~/lib/db/schema'
import type { InsightEvent, InsightMetric } from '~~/shared/insights'

function destinationMetric(
  key: Extract<InsightEvent, { action: 'click' }>['destination'],
  url: string,
): InsightMetric {
  const destination = new URL(url)
  if (destination.protocol === 'tel:') return 'phone'
  if (destination.protocol === 'mailto:') return 'email'
  if (
    ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'whatsapp.com'].includes(destination.hostname)
  )
    return 'whatsapp'
  if (key === 'websiteUrl') return 'website'
  if (key === 'appStoreUrl') return 'app_store'
  if (key === 'playStoreUrl') return 'play_store'
  return key === 'socialUrl' ? 'social' : 'contact'
}

export async function recordBusinessInsight(
  input: InsightEvent,
  context: { ip: string; userAgent: string; userId?: string },
): Promise<void> {
  const secret = process.env.BETTER_AUTH_SECRET
  // Fail closed: never persist an unhashed identifier or use a predictable fallback key.
  if (!secret) throw new Error('insights_configuration_missing')
  await db.transaction(async (tx) => {
    const [clock] = await tx
      .select({
        day: sql<string>`to_char(now() at time zone 'UTC', 'YYYY-MM-DD')`,
        minute: sql<string>`floor(extract(epoch from now()) / 60)::text`,
        halfHour: sql<string>`floor(extract(epoch from now()) / 1800)::text`,
      })
      .from(sql`(select 1) as clock`)
    if (!clock) return
    const hash = (value: string) => createHmac('sha256', secret).update(value).digest('hex')
    // Daily keyed hashes are used only for short-lived throttling; raw IP/UA are never saved.
    const network = hash(JSON.stringify([clock.day, context.ip]))
    const visitor = hash(JSON.stringify([clock.day, context.ip, context.userAgent]))
    const expired = tx
      .select({ key: businessInsightGuard.key })
      .from(businessInsightGuard)
      .where(lt(businessInsightGuard.expiresAt, sql`now()`))
      .orderBy(businessInsightGuard.expiresAt)
      .limit(100)
    await tx.delete(businessInsightGuard).where(inArray(businessInsightGuard.key, expired))
    const [allowed] = await tx
      .insert(businessInsightGuard)
      .values({
        key: `rate:${network}:${clock.minute}`,
        count: 1,
        expiresAt: sql`now() + interval '2 minutes'`,
      })
      .onConflictDoUpdate({
        target: businessInsightGuard.key,
        set: { count: sql`${businessInsightGuard.count} + 1` },
        setWhere: lt(businessInsightGuard.count, 60),
      })
      .returning({ key: businessInsightGuard.key })
    if (!allowed) return
    const [item] = await tx
      .select()
      .from(business)
      .where(and(eq(business.id, input.businessId), eq(business.status, 'approved')))
      .limit(1)
      .for('share')
    if (
      !item ||
      item.ownerUserId === context.userId ||
      (input.surface === 'bio' && item.listingSource === 'curated')
    )
      return
    let metric: InsightMetric
    if (input.action === 'view') metric = input.surface === 'profile' ? 'profile_view' : 'bio_view'
    else {
      const url = item[input.destination]
      if (!url) return
      metric = destinationMetric(input.destination, url)
    }
    const [accepted] = await tx
      .insert(businessInsightGuard)
      .values({
        key: `event:${hash(JSON.stringify([visitor, item.id, input.surface, metric, clock.halfHour]))}`,
        count: 1,
        expiresAt: sql`now() + interval '1 hour'`,
      })
      .onConflictDoNothing()
      .returning({ key: businessInsightGuard.key })
    if (!accepted) return
    await tx
      .insert(businessInsightDaily)
      .values({ id: randomUUID(), businessId: item.id, day: clock.day, metric, count: 1 })
      .onConflictDoUpdate({
        target: [
          businessInsightDaily.businessId,
          businessInsightDaily.day,
          businessInsightDaily.metric,
        ],
        set: { count: sql`${businessInsightDaily.count} + 1` },
      })
  })
}

export async function cleanupInsightGuards(): Promise<number> {
  const expired = db
    .select({ key: businessInsightGuard.key })
    .from(businessInsightGuard)
    .where(lt(businessInsightGuard.expiresAt, sql`now()`))
    .orderBy(businessInsightGuard.expiresAt)
    .limit(1000)
  const deleted = await db
    .delete(businessInsightGuard)
    .where(inArray(businessInsightGuard.key, expired))
    .returning({ key: businessInsightGuard.key })
  return deleted.length
}
