export function logEmailEvent(event: {
  operation: 'enqueue' | 'deliver' | 'process' | 'cleanup'
  outcome: 'success' | 'failure'
  jobId?: string
  attempt?: number
  code?: string
  terminal?: boolean
  count?: number
}): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    domain: 'notifications',
    ...event,
  })
  if (event.outcome === 'failure') console.error(entry)
  else console.info(entry)
}
