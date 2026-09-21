import { getDiscoveryConfiguration } from '@server/domains/discovery/config'
import { closeGeminiConnections } from '@server/domains/discovery/gemini'
import { DiscoveryError } from '@server/domains/discovery/errors'
import { logDiscovery } from '@server/domains/discovery/telemetry'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', closeGeminiConnections)
  try {
    getDiscoveryConfiguration()
  } catch (error) {
    const code = error instanceof DiscoveryError ? error.code : 'unexpected_failure'
    // Discovery is optional: report its readiness without taking the directory offline.
    logDiscovery({
      operation: 'configure',
      outcome: code === 'disabled' || code === 'configuration_missing' ? 'disabled' : 'failure',
      code,
    })
  }
})
