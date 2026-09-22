import { cleanupEmailOutbox } from '@server/domains/notifications/processor'
import { logEmailEvent } from '@server/domains/notifications/telemetry'

export default defineTask({
  meta: {
    name: 'email-notifications-cleanup',
    description: 'Remove old completed email notifications.',
  },
  async run() {
    try {
      const removed = await cleanupEmailOutbox()
      if (removed) logEmailEvent({ operation: 'cleanup', outcome: 'success', count: removed })
      return { result: { removed } }
    } catch {
      logEmailEvent({ operation: 'cleanup', outcome: 'failure', code: 'email_cleanup_unavailable' })
      throw new Error('Email notification cleanup failed.')
    }
  },
})
