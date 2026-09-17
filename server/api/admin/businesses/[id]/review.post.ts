import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireAdmin } from '../../../../utils/access'
import { readValidatedJson } from '../../../../utils/validated-json'
import { reviewBusinessSchema } from '../../../../domains/businesses/validation'
import { reviewBusiness } from '../../../../domains/businesses/service'
import { rethrowBusinessError } from '../../../../domains/businesses/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  const input = await readValidatedJson(event, reviewBusinessSchema)
  try {
    return await reviewBusiness(id, user.id, input)
  } catch (error) {
    rethrowBusinessError(error)
  }
})
