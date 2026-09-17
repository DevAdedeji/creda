import { createError, getQuery } from 'h3'
import { z } from 'zod'
import { requireVerifiedUser } from '@server/utils/access'
import { listSavedBusinesses } from '@server/domains/businesses/service'

const querySchema = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1) })

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid page.' })
  return listSavedBusinesses(user.id, query.data.page)
})
