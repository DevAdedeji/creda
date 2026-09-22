import { getCategorySummaries } from '@server/domains/categories/service'

export default defineEventHandler(async () => {
  try {
    return await getCategorySummaries()
  } catch {
    console.error(
      JSON.stringify({
        domain: 'categories',
        operation: 'list',
        outcome: 'failure',
        code: 'categories_unavailable',
      }),
    )
    throw createError({
      statusCode: 503,
      message: 'Categories could not be loaded. Please try again.',
    })
  }
})
