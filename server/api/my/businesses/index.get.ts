import { requireVerifiedUser } from '@server/utils/access'
import { listOwnedBusinesses } from '@server/domains/businesses/service'

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  return { items: await listOwnedBusinesses(user.id) }
})
