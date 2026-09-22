import { createError, getQuery, setHeader } from 'h3'
import { requireAdmin } from '@server/utils/access'
import { listAdminReviews } from '@server/domains/reviews/service'
import { adminReviewQuerySchema } from '@server/domains/reviews/validation'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  await requireAdmin(event)
  const parsed = adminReviewQuerySchema.safeParse(getQuery(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid review filters.' })
  return listAdminReviews(parsed.data)
})
