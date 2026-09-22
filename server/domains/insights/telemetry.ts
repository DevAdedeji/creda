import { randomUUID } from 'node:crypto'

export function logInsightFailure(operation: 'read' | 'record' | 'cleanup'): string {
  const requestId = randomUUID()
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      domain: 'insights',
      operation,
      outcome: 'failure',
      request_id: requestId,
    }),
  )
  return requestId
}
