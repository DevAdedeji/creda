const failures = {
  configuration_missing: [503, 'Natural-language search is not configured yet.', false],
  configuration_invalid: [
    503,
    'Natural-language search is unavailable because of a configuration issue.',
    false,
  ],
  disabled: [503, 'Natural-language search is currently turned off.', false],
  global_daily_limit: [
    429,
    'Natural-language search has reached its daily limit. Please try again tomorrow.',
    true,
  ],
  user_daily_limit: [
    429,
    'You’ve used your natural-language searches for today. Please try again tomorrow.',
    true,
  ],
  user_minute_limit: [429, 'Please wait a minute before searching again.', true],
  provider_timeout: [503, 'Natural-language search took too long. Please try again.', true],
  provider_network: [
    503,
    'We couldn’t connect to natural-language search. Please try again later.',
    true,
  ],
  provider_rate_limit: [503, 'Natural-language search is busy. Please try again later.', true],
  provider_rejected: [
    503,
    'Natural-language search is unavailable. Please try again later.',
    false,
  ],
  provider_unavailable: [
    503,
    'Natural-language search is temporarily unavailable. Please try again later.',
    true,
  ],
  provider_invalid_json: [502, 'We couldn’t read the search response. Please try again.', true],
  provider_invalid_envelope: [
    502,
    'We received an invalid search response. Please try again.',
    true,
  ],
  provider_incomplete: [
    502,
    'The search response was incomplete. Try a shorter description.',
    false,
  ],
  provider_blocked: [422, 'Try describing the type of business and where you need it.', false],
  provider_invalid_interpretation: [
    502,
    'We couldn’t interpret that search. Try a business type and location.',
    false,
  ],
  usage_unavailable: [
    503,
    'Natural-language search is temporarily unavailable. Please try again later.',
    true,
  ],
  unexpected_failure: [
    503,
    'Natural-language search is temporarily unavailable. Please try again later.',
    true,
  ],
} as const

export const discoveryNetworkCodes = [
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'UND_ERR_SOCKET',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
] as const
export type DiscoveryNetworkCode = (typeof discoveryNetworkCodes)[number]

export type DiscoveryFailureCode = keyof typeof failures
export class DiscoveryError extends Error {
  readonly statusCode: number
  readonly retryable: boolean
  constructor(
    readonly code: DiscoveryFailureCode,
    readonly providerStatus?: number,
    readonly networkCode?: DiscoveryNetworkCode,
  ) {
    const [statusCode, message, retryable] = failures[code]
    super(message)
    this.name = 'DiscoveryError'
    this.statusCode = statusCode
    this.retryable = retryable
  }
}
