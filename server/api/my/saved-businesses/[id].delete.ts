import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { unsaveBusiness } from '@server/domains/businesses/service'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  await unsaveBusiness(user.id, id)
  return { saved: false }
})
