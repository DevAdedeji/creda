import { randomUUID } from 'node:crypto'
import { createError, setHeader } from 'h3'
import { askDiscoverySchema, type AskDiscoveryResponse } from '~~/shared/discovery'
import { interpretDiscovery } from '@server/domains/discovery/gemini'
import { getDiscoveryConfiguration } from '@server/domains/discovery/config'
import { DiscoveryError } from '@server/domains/discovery/errors'
import { logDiscovery } from '@server/domains/discovery/telemetry'
import { reserveDiscoveryUsage } from '@server/domains/discovery/usage'
import { assertSameOrigin } from '@server/utils/access'
import { auth } from '~~/lib/auth'
import { discoveryGuestKey } from '@server/domains/discovery/identity'
import { readValidatedJson } from '@server/utils/validated-json'

export default defineEventHandler(async (event): Promise<AskDiscoveryResponse> => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const requestId = randomUUID()
  setHeader(event, 'X-Request-Id', requestId)
  assertSameOrigin(event)
  const input = await readValidatedJson(event, askDiscoverySchema)
  const startedAt = performance.now()
  let stage: 'configuration' | 'usage' | 'provider' = 'configuration'
  try {
    const config = getDiscoveryConfiguration()
    stage = 'usage'
    const session = await auth.api.getSession({ headers: event.headers })
    const visitorKey = session?.user.id ?? discoveryGuestKey(event, config.rateLimitSecret)
    const remaining = await reserveDiscoveryUsage(visitorKey, config)
    setHeader(event, 'X-Ask-Creda-Remaining', String(remaining))
    stage = 'provider'
    const interpretation = await interpretDiscovery(input, config)
    logDiscovery({
      operation: 'interpret',
      outcome: 'success',
      requestId,
      durationMs: Math.round(performance.now() - startedAt),
    })
    return { ...interpretation, remaining }
  } catch (error) {
    const failure =
      error instanceof DiscoveryError
        ? error
        : new DiscoveryError(stage === 'usage' ? 'usage_unavailable' : 'unexpected_failure')
    logDiscovery({
      operation: 'interpret',
      outcome: 'failure',
      requestId,
      stage,
      code: failure.code,
      providerStatus: failure.providerStatus,
      networkCode: failure.networkCode,
      retryable: failure.retryable,
      durationMs: Math.round(performance.now() - startedAt),
    })
    if (failure.code === 'user_minute_limit') setHeader(event, 'Retry-After', '60')
    throw createError({
      statusCode: failure.statusCode,
      statusMessage:
        failure.statusCode === 429
          ? 'Too Many Requests'
          : failure.statusCode === 422
            ? 'Unprocessable Content'
            : failure.statusCode === 502
              ? 'Bad Gateway'
              : 'Service Unavailable',
      message: failure.message,
      data: {
        message: failure.message,
        code: failure.code,
        retryable: failure.retryable,
        requestId,
      },
    })
  }
})
