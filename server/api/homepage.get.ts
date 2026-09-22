import { setHeader } from 'h3'
import { getHomepageBusinesses } from '@server/domains/homepage/service'
import { rethrowHomepageError } from '@server/domains/homepage/http-error'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  try {
    return await getHomepageBusinesses()
  } catch (error) {
    rethrowHomepageError(error, 'public')
  }
})
