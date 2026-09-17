import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { submitReportSchema } from '@server/domains/reports/validation'
import { submitReport } from '@server/domains/reports/service'
import { rethrowReportError } from '@server/domains/reports/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const input = await readValidatedJson(event, submitReportSchema)
  try {
    return await submitReport(user.id, input)
  } catch (error) {
    rethrowReportError(error)
  }
})
