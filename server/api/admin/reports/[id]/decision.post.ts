import { createError, getRouterParam } from 'h3'
import { assertSameOrigin, requireAdmin } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { reportDecisionSchema } from '@server/domains/reports/validation'
import { decideReport } from '@server/domains/reports/service'
import { rethrowReportError } from '@server/domains/reports/http-error'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw createError({ statusCode: 404, statusMessage: 'Report not found.' })
  const input = await readValidatedJson(event, reportDecisionSchema)
  try {
    await decideReport(id, admin.id, input)
    return { ok: true }
  } catch (error) {
    rethrowReportError(error)
  }
})
