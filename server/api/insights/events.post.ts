import { createError, getHeader, getRequestIP, setHeader, setResponseStatus } from 'h3'
import { auth } from '~~/lib/auth'
import { assertSameOrigin } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { insightEventSchema } from '@server/domains/insights/validation'
import { recordBusinessInsight } from '@server/domains/insights/tracking'
import { logInsightFailure } from '@server/domains/insights/telemetry'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  assertSameOrigin(event)
  const input = await readValidatedJson(event, insightEventSchema)
  const userAgent = getHeader(event, 'user-agent') ?? ''
  const ip = getRequestIP(event, { xForwardedFor: true })
  if (
    getHeader(event, 'dnt') === '1' ||
    getHeader(event, 'sec-gpc') === '1' ||
    !ip ||
    !userAgent ||
    /bot|crawler|spider|headless|preview|slurp/i.test(userAgent)
  ) {
    setResponseStatus(event, 204)
    return
  }
  try {
    const session = await auth.api.getSession({ headers: event.headers })
    await recordBusinessInsight(input, {
      ip,
      userAgent: userAgent.slice(0, 512),
      userId: session?.user.id,
    })
  } catch {
    const requestId = logInsightFailure('record')
    throw createError({
      statusCode: 503,
      statusMessage: 'Insights unavailable',
      data: { requestId },
    })
  }
  setResponseStatus(event, 204)
})
