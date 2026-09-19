import { createError, getRouterParam } from 'h3'
import { rethrowOwnershipError } from '@server/domains/ownership/http-error'
import { getBusinessClaim } from '@server/domains/ownership/service'
import { requireVerifiedUser } from '@server/utils/access'

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  try {
    return await getBusinessClaim(slug, user.id)
  } catch (error) {
    rethrowOwnershipError(error)
  }
})
