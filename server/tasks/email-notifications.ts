import { processEmailOutbox } from '@server/domains/notifications/processor'
import { logEmailEvent } from '@server/domains/notifications/telemetry'

export default defineTask({
  meta: { name: 'email-notifications', description: 'Deliver queued business notifications.' },
  async run() {
    try {
      return { result: { processed: await processEmailOutbox() } }
    } catch {
      logEmailEvent({ operation: 'process', outcome: 'failure', code: 'email_queue_unavailable' })
      throw new Error('Email notification processing failed; queued messages will be retried.')
    }
  },
})
