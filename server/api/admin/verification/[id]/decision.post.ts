import { createError, getRouterParam } from 'h3'
import { rethrowOwnershipError } from '@server/domains/ownership/http-error'
import { decideOwnershipVerification } from '@server/domains/ownership/service'
import { ownershipDecisionSchema } from '@server/domains/ownership/validation'
import { assertSameOrigin, requireAdmin } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Request not found.' })
  const input = await readValidatedJson(event, ownershipDecisionSchema)
  try {
    return await decideOwnershipVerification(id, user.id, input)
  } catch (error) {
    rethrowOwnershipError(error)
  }
})
