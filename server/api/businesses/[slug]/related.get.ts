import { createError, getRouterParam } from 'h3'
import { listRelatedBusinesses } from '@server/domains/businesses/related'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    throw createError({ statusCode: 404, message: 'Business not found.' })
  }
  let items
  try {
    items = await listRelatedBusinesses(slug)
  } catch {
    console.error(
      JSON.stringify({
        domain: 'businesses',
        operation: 'related',
        outcome: 'failure',
        code: 'related_unavailable',
      }),
    )
    throw createError({
      statusCode: 503,
      message: 'Related businesses could not be loaded. Please try again.',
    })
  }
  if (!items) throw createError({ statusCode: 404, message: 'Business not found.' })
  return { items }
})
