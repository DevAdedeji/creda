import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { editReviewSchema } from '@server/domains/reviews/validation'
import { editReview } from '@server/domains/reviews/service'
import { rethrowReviewError } from '@server/domains/reviews/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Review not found.' })
  const input = await readValidatedJson(event, editReviewSchema)
  try {
    return await editReview(id, user.id, input)
  } catch (error) {
    rethrowReviewError(error)
  }
})
