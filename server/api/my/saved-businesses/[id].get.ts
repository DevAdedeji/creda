import { createError, getRouterParam } from 'h3'
import { requireVerifiedUser } from '@server/utils/access'
import { isBusinessSaved } from '@server/domains/businesses/service'

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  return { saved: await isBusinessSaved(user.id, id) }
})
