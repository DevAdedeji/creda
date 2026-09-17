import { requireAdmin } from '../../../utils/access'
import { listPendingBusinesses } from '../../../domains/businesses/service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { items: await listPendingBusinesses() }
})
