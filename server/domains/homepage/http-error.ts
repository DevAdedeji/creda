import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { HomepageSelectionError } from './service'

export function rethrowHomepageError(error: unknown, operation: 'read' | 'save' | 'public'): never {
  if (error instanceof HomepageSelectionError) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Homepage selection changed.',
      message: error.message,
      data: { message: error.message },
    })
  }
  const requestId = randomUUID()
  let cause = error
  let databaseCode: string | undefined
  for (let depth = 0; depth < 5 && cause && typeof cause === 'object'; depth++) {
    if ('code' in cause && typeof cause.code === 'string' && /^[0-9A-Z]{5}$/.test(cause.code)) {
      databaseCode = cause.code
      break
    }
    cause = 'cause' in cause ? cause.cause : undefined
  }
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      request_id: requestId,
      domain: 'homepage',
      operation,
      outcome: 'failure',
      code: 'homepage_unavailable',
      database_code: databaseCode,
    }),
  )
  throw createError({
    statusCode: 503,
    statusMessage: 'Homepage temporarily unavailable.',
    message: 'Homepage choices could not be loaded or saved. Please try again.',
    data: { requestId },
  })
}
