import { requireAdmin } from '@server/utils/access'
import { listPendingBusinesses } from '@server/domains/businesses/service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { items: await listPendingBusinesses() }
})
