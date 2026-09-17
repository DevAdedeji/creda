import { createError, getRouterParam } from 'h3'
import { getOwnerVerification } from '@server/domains/ownership/service'
import { rethrowOwnershipError } from '@server/domains/ownership/http-error'
import { requireVerifiedUser } from '@server/utils/access'

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  try {
    return await getOwnerVerification(id, user.id)
  } catch (error) {
    rethrowOwnershipError(error)
  }
})
