import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '../../../utils/access'
import { readValidatedJson } from '../../../utils/validated-json'
import { businessSubmissionSchema } from '../../../domains/businesses/validation'
import { updateBusiness } from '../../../domains/businesses/service'
import { rethrowBusinessError } from '../../../domains/businesses/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  const input = await readValidatedJson(event, businessSubmissionSchema)
  try {
    return await updateBusiness(id, user.id, input)
  } catch (error) {
    rethrowBusinessError(error)
  }
})
