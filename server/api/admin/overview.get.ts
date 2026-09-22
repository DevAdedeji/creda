import { randomUUID } from 'node:crypto'
import { createError, getQuery, setHeader } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '@server/utils/access'
import { getAdminOverview } from '@server/domains/admin/service'
import type { AdminOverviewPeriod } from '~~/shared/admin'

const querySchema = z.object({
  days: z
    .enum(['all', '7', '30'])
    .default('all')
    .transform((value): AdminOverviewPeriod => (value === 'all' ? 'all' : value === '30' ? 30 : 7)),
})

function databaseErrorCode(error: unknown): string | undefined {
  let cause = error
  for (let depth = 0; depth < 5 && cause && typeof cause === 'object'; depth++) {
    if ('code' in cause && typeof cause.code === 'string' && /^[0-9A-Z]{5}$/.test(cause.code)) {
      return cause.code
    }
    cause = 'cause' in cause ? cause.cause : undefined
  }
  return undefined
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  setHeader(event, 'x-robots-tag', 'noindex, nofollow')
  await requireAdmin(event)
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid overview period.' })
  }
  const requestId = randomUUID()
  setHeader(event, 'x-request-id', requestId)
  try {
    return await getAdminOverview(query.data.days)
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        request_id: requestId,
        domain: 'admin',
        operation: 'overview',
        outcome: 'failure',
        code: 'overview_unavailable',
        database_code: databaseErrorCode(error),
      }),
    )
    throw createError({
      statusCode: 503,
      statusMessage: 'Overview temporarily unavailable.',
      data: { requestId },
    })
  }
})
