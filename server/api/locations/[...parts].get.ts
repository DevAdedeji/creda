import { getLocationPage } from '@server/domains/locations/service'
import { locationRequest } from '@server/domains/locations/http'
import { collectionPage } from '~~/shared/seo/categories'
import { parseLocationParts } from '~~/shared/seo/locations'
export default defineEventHandler(async (event) => {
  const parts = (getRouterParam(event, 'parts') ?? '').split('/')
  const page = collectionPage(getQuery(event).page)
  if (!parseLocationParts(parts) || page === null)
    throw createError({ statusCode: 404, message: 'Location page not found.' })
  const result = await locationRequest('businesses', () => getLocationPage(parts, page))
  if (!result) throw createError({ statusCode: 404, message: 'Location page not found.' })
  return result
})
