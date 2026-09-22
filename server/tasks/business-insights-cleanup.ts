import { cleanupInsightGuards } from '@server/domains/insights/tracking'
import { logInsightFailure } from '@server/domains/insights/telemetry'

export default defineTask({
  meta: {
    name: 'business-insights-cleanup',
    description: 'Remove expired anonymous insights deduplication keys.',
  },
  async run() {
    try {
      return { result: { processed: await cleanupInsightGuards() } }
    } catch {
      const requestId = logInsightFailure('cleanup')
      throw new Error(`Insights cleanup failed (${requestId})`)
    }
  },
})
