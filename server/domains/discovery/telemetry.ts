import type { DiscoveryFailureCode, DiscoveryNetworkCode } from './errors'

type DiscoveryLog = {
  operation: 'configure' | 'interpret'
  outcome: 'success' | 'failure' | 'disabled'
  requestId?: string
  stage?: 'configuration' | 'usage' | 'provider'
  durationMs?: number
  code?: DiscoveryFailureCode
  providerStatus?: number
  networkCode?: DiscoveryNetworkCode
  retryable?: boolean
}

export function logDiscovery(event: DiscoveryLog): void {
  // An explicit allowlist prevents future callers from accidentally logging input or secrets.
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    domain: 'discovery',
    operation: event.operation,
    outcome: event.outcome,
    request_id: event.requestId,
    stage: event.stage,
    duration_ms: event.durationMs,
    code: event.code,
    provider_status: event.providerStatus,
    network_code: event.networkCode,
    retryable: event.retryable,
  })
  if (event.outcome === 'failure') console.warn(entry)
  else console.info(entry)
}
