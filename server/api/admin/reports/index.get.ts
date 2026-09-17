import { createError, getQuery } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '@server/utils/access'
import { listAdminReports } from '@server/domains/reports/service'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  status: z.enum(['open', 'dismissed', 'actioned', 'restored']).default('open'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid report filters.' })
  return listAdminReports(query.data.page, query.data.status)
})
