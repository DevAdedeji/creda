import { setResponseStatus } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { submitReviewSchema } from '@server/domains/reviews/validation'
import { submitReview } from '@server/domains/reviews/service'
import { rethrowReviewError } from '@server/domains/reviews/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const input = await readValidatedJson(event, submitReviewSchema)
  try {
    const result = await submitReview(user.id, input)
    setResponseStatus(event, 201)
    return result
  } catch (error) {
    rethrowReviewError(error)
  }
})
