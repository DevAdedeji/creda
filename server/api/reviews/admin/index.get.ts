import { createError, getQuery } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '@server/utils/access'
import { listAdminReviews } from '@server/domains/reviews/service'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  status: z.enum(['pending', 'published', 'rejected', 'removed']).default('pending'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid review filters.' })
  return listAdminReviews(parsed.data.page, parsed.data.status)
})
