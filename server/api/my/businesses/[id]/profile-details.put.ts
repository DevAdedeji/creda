import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { businessProfileUpdateSchema } from '~~/shared/business-profile'
import {
  BusinessProfileError,
  saveBusinessProfileDetails,
} from '@server/domains/businesses/profile-details'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, message: 'Business not found.' })
  const input = await readValidatedJson(event, businessProfileUpdateSchema, 65_536)
  try {
    return await saveBusinessProfileDetails(id, user.id, input)
  } catch (error) {
    if (error instanceof BusinessProfileError)
      throw createError({
        statusCode: error.code === 'not_found' ? 404 : 409,
        message: error.message,
        data: { code: error.code, message: error.message },
      })
    console.error(
      JSON.stringify({
        domain: 'businesses',
        operation: 'save_profile_details',
        outcome: 'failure',
        code: 'profile_details_unavailable',
      }),
    )
    throw createError({
      statusCode: 503,
      message: 'We could not save these details. Your changes are still here; please try again.',
    })
  }
})
