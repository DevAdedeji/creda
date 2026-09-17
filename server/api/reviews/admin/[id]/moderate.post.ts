import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireAdmin } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { moderateReviewSchema } from '@server/domains/reviews/validation'
import { moderateReview } from '@server/domains/reviews/service'
import { rethrowReviewError } from '@server/domains/reviews/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Review not found.' })
  const input = await readValidatedJson(event, moderateReviewSchema)
  try {
    await moderateReview(id, admin.id, input)
    return { ok: true }
  } catch (error) {
    rethrowReviewError(error)
  }
})
