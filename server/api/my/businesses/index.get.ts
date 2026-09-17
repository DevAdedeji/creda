import { requireVerifiedUser } from '../../../utils/access'
import { listOwnedBusinesses } from '../../../domains/businesses/service'

export default defineEventHandler(async (event) => {
  const user = await requireVerifiedUser(event)
  return { items: await listOwnedBusinesses(user.id) }
})
