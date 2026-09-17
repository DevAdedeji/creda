import { createError, getRouterParam, setResponseStatus } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { deleteReview } from '@server/domains/reviews/service'
import { rethrowReviewError } from '@server/domains/reviews/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Review not found.' })
  try {
    await deleteReview(id, user.id)
    setResponseStatus(event, 204)
    return null
  } catch (error) {
    rethrowReviewError(error)
  }
})
