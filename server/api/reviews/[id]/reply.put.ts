import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { replySchema } from '@server/domains/reviews/validation'
import { saveOwnerReply } from '@server/domains/reviews/service'
import { rethrowReviewError } from '@server/domains/reviews/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const owner = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Review not found.' })
  const { body } = await readValidatedJson(event, replySchema)
  try {
    return await saveOwnerReply(id, owner.id, body)
  } catch (error) {
    rethrowReviewError(error)
  }
})
