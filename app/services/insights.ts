import type { InsightEvent } from '~~/shared/insights'

export function sendBusinessInsight(event: InsightEvent): void {
  // Analytics must never delay a destination link or interrupt the business page.
  void $fetch('/api/insights/events', {
    method: 'POST',
    body: event,
    keepalive: true,
    timeout: 5000,
    retry: 0,
  }).catch(() => {})
}
