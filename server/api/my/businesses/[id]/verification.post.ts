import { createError, getRouterParam } from 'h3'
import { rethrowOwnershipError } from '@server/domains/ownership/http-error'
import { requestOwnershipVerification } from '@server/domains/ownership/service'
import { ownershipRequestSchema } from '@server/domains/ownership/validation'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  const input = await readValidatedJson(event, ownershipRequestSchema)
  try {
    return await requestOwnershipVerification(id, user.id, input)
  } catch (error) {
    rethrowOwnershipError(error)
  }
})
