import { lt, sql, type SQL } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { discoveryUsage } from '~~/lib/db/schema'
import { discoveryProviderLimits, type DiscoveryConfiguration } from './config'
import { DiscoveryError, type DiscoveryFailureCode } from './errors'

export async function reserveDiscoveryUsage(
  userId: string,
  config: DiscoveryConfiguration,
): Promise<number> {
  const { userDailyLimit: userLimit, globalDailyLimit: globalLimit } = config
  return db.transaction(async (tx) => {
    await tx.delete(discoveryUsage).where(lt(discoveryUsage.expiresAt, sql`now()`))
    const day = sql`to_char(now() at time zone 'UTC', 'YYYY-MM-DD')`
    const minute = sql`to_char(now() at time zone 'UTC', 'YYYY-MM-DD-HH24-MI')`
    // Fixed order and atomic increments make limits apply across Railway replicas.
    const buckets: { key: SQL; limit: number; expiry: SQL; code: DiscoveryFailureCode }[] = [
      {
        key: sql`'global:' || ${day}`,
        limit: globalLimit,
        expiry: sql`now() + interval '2 days'`,
        code: 'global_daily_limit',
      },
      {
        key: sql`${'user:' + userId + ':'} || ${day}`,
        limit: userLimit,
        expiry: sql`now() + interval '2 days'`,
        code: 'user_daily_limit',
      },
      {
        key: sql`${'minute:' + userId + ':'} || ${minute}`,
        limit: discoveryProviderLimits.requestsPerMinute,
        expiry: sql`now() + interval '2 minutes'`,
        code: 'user_minute_limit',
      },
    ]
    let remaining = 0
    for (const [index, bucket] of buckets.entries()) {
      if (!bucket.limit) throw new DiscoveryError(bucket.code)
      const [row] = await tx
        .insert(discoveryUsage)
        .values({ key: bucket.key, count: 1, expiresAt: bucket.expiry })
        .onConflictDoUpdate({
          target: discoveryUsage.key,
          set: { count: sql`${discoveryUsage.count} + 1` },
          setWhere: lt(discoveryUsage.count, bucket.limit),
        })
        .returning({ count: discoveryUsage.count })
      if (!row) throw new DiscoveryError(bucket.code)
      if (index === 1) remaining = Math.max(0, userLimit - row.count)
    }
    // Reserve before the provider call; failed attempts count to keep spending bounded.
    return remaining
  })
}
