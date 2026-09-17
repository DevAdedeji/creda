import { createError, getRouterParam } from 'h3'
import { requireVerifiedUser } from '../../../utils/access'
import { getOwnedBusiness } from '../../../domains/businesses/service'

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  const business = await getOwnedBusiness(id, user.id)
  if (!business) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  return business
})
