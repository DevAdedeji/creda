import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { businessSlugSchema } from '@server/domains/businesses/validation'
import { updateBusinessSlug } from '@server/domains/businesses/service'
import { rethrowBusinessError } from '@server/domains/businesses/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  const { slug } = await readValidatedJson(event, businessSlugSchema)
  try {
    return await updateBusinessSlug(id, user.id, slug)
  } catch (error) {
    rethrowBusinessError(error)
  }
})
