import { setResponseStatus } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { businessSubmissionSchema } from '@server/domains/businesses/validation'
import { createBusiness } from '@server/domains/businesses/service'
import { rethrowBusinessError } from '@server/domains/businesses/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const input = await readValidatedJson(event, businessSubmissionSchema)
  try {
    const created = await createBusiness(user.id, input)
    setResponseStatus(event, 201)
    return created
  } catch (error) {
    rethrowBusinessError(error)
  }
})
