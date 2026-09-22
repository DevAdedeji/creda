import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { getHeader, getRequestIP, type H3Event } from 'h3'
import { DiscoveryError } from './errors'

export function discoveryGuestKey(event: H3Event, secret: string): string {
  // Railway overwrites X-Real-IP at its edge. Direct local requests must not trust forwarded headers.
  const address = process.env.RAILWAY_ENVIRONMENT_ID
    ? getHeader(event, 'x-real-ip')?.trim()
    : getRequestIP(event)
  if (!address || !isIP(address)) throw new DiscoveryError('usage_unavailable')
  const normalized = isIP(address) === 6 ? new URL(`http://[${address}]`).hostname : address
  // Only the keyed hash reaches the short-lived quota table; never store or log the address.
  return `guest:${createHmac('sha256', secret).update(`creda:discovery:${normalized}`).digest('hex')}`
}
