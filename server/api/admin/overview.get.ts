import { createError, getQuery, setHeader } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '@server/utils/access'
import { getAdminOverview } from '@server/domains/admin/service'

const querySchema = z.object({
  days: z
    .enum(['7', '30'])
    .default('7')
    .transform((value): 7 | 30 => (value === '30' ? 30 : 7)),
})

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  setHeader(event, 'x-robots-tag', 'noindex, nofollow')
  await requireAdmin(event)
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid overview period.' })
  }
  try {
    return await getAdminOverview(query.data.days)
  } catch {
    console.error(
      JSON.stringify({
        domain: 'admin',
        operation: 'overview',
        outcome: 'failure',
        code: 'overview_unavailable',
      }),
    )
    throw createError({ statusCode: 503, statusMessage: 'Overview temporarily unavailable.' })
  }
})
