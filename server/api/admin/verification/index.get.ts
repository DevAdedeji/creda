import { listAdminVerification } from '@server/domains/ownership/service'
import { requireAdmin } from '@server/utils/access'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { items: await listAdminVerification() }
})
