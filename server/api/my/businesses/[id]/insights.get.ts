import { createError, getQuery, getRouterParam, isError, setHeader } from 'h3'
import { requireVerifiedUser } from '@server/utils/access'
import { getBusinessInsights } from '@server/domains/insights/service'
import { logInsightFailure } from '@server/domains/insights/telemetry'
import { insightBusinessIdSchema, insightQuerySchema } from '@server/domains/insights/validation'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const user = await requireVerifiedUser(event)
  const id = insightBusinessIdSchema.safeParse(getRouterParam(event, 'id'))
  const query = insightQuerySchema.safeParse(getQuery(event))
  if (!id.success) throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Choose 7 or 30 days.' })
  try {
    return await getBusinessInsights(id.data, user.id, query.data.days === '30' ? 30 : 7)
  } catch (error) {
    if (isError(error)) throw error
    const requestId = logInsightFailure('read')
    throw createError({
      statusCode: 503,
      statusMessage: 'Insights unavailable. Please try again.',
      data: { requestId },
    })
  }
})
