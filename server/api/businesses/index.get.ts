import { createError, getQuery } from 'h3'
import { businessListQuerySchema } from '@server/domains/businesses/validation'
import { listPublicBusinesses } from '@server/domains/businesses/service'

export default defineEventHandler(async (event) => {
  const parsed = businessListQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid search filters.' })
  }
  return listPublicBusinesses(parsed.data)
})
