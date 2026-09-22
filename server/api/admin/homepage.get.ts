import { setHeader } from 'h3'
import { requireAdmin } from '@server/utils/access'
import { getHomepageSelection } from '@server/domains/homepage/service'
import { rethrowHomepageError } from '@server/domains/homepage/http-error'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  await requireAdmin(event)
  try {
    return await getHomepageSelection()
  } catch (error) {
    rethrowHomepageError(error, 'read')
  }
})
