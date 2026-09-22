import { setHeader } from 'h3'
import { assertSameOrigin, requireAdmin } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { homepageSelectionSchema } from '@server/domains/homepage/validation'
import { saveHomepageSelection } from '@server/domains/homepage/service'
import { rethrowHomepageError } from '@server/domains/homepage/http-error'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  assertSameOrigin(event)
  await requireAdmin(event)
  const input = await readValidatedJson(event, homepageSelectionSchema)
  try {
    return await saveHomepageSelection(input)
  } catch (error) {
    rethrowHomepageError(error, 'save')
  }
})
