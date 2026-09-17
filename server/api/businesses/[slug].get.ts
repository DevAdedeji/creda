import { createError, getRouterParam } from 'h3'
import { getPublicBusiness } from '../../domains/businesses/service'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  }
  const business = await getPublicBusiness(slug)
  if (!business) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  return business
})
