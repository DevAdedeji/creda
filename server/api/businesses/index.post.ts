import { setResponseStatus } from 'h3'
import { assertSameOrigin, requireVerifiedUser } from '../../utils/access'
import { readValidatedJson } from '../../utils/validated-json'
import { businessSubmissionSchema } from '../../domains/businesses/validation'
import { createBusiness } from '../../domains/businesses/service'
import { rethrowBusinessError } from '../../domains/businesses/http-error'

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
