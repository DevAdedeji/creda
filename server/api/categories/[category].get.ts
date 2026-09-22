import { getCategoryBusinesses } from '@server/domains/categories/service'
import { collectionPage, getBusinessCategory } from '~~/shared/seo/categories'

export default defineEventHandler(async (event) => {
  const category = getBusinessCategory(getRouterParam(event, 'category') ?? '')
  const page = collectionPage(getQuery(event).page)
  if (!category || page === null)
    throw createError({ statusCode: 404, message: 'Category page not found.' })
  const result = await getCategoryBusinesses(category.value, page).catch(() => {
    console.error(
      JSON.stringify({
        domain: 'categories',
        operation: 'businesses',
        outcome: 'failure',
        code: 'category_businesses_unavailable',
      }),
    )
    throw createError({
      statusCode: 503,
      message: 'Businesses could not be loaded. Please try again.',
    })
  })
  if (page > Math.max(1, Math.ceil(result.total / result.pageSize))) {
    throw createError({ statusCode: 404, message: 'Category page not found.' })
  }
  return result
})
