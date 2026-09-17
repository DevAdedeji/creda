import { createError, getQuery } from 'h3'
import { z } from 'zod'
import { requireVerifiedUser } from '@server/utils/access'
import { listSavedBusinessIds } from '@server/domains/businesses/service'

const querySchema = z.object({
  ids: z
    .string()
    .max(443)
    .transform((value) => value.split(','))
    .pipe(z.array(z.uuid()).min(1).max(12)),
})

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid business IDs.' })
  }
  return { ids: await listSavedBusinessIds(user.id, parsed.data.ids) }
})
