export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data
    if (data && typeof data === 'object' && 'data' in data) {
      const details = data.data
      if (
        details &&
        typeof details === 'object' &&
        'message' in details &&
        typeof details.message === 'string' &&
        details.message
      ) {
        return details.message
      }
    }
    if (data && typeof data === 'object' && 'statusMessage' in data) {
      const message = data.statusMessage
      if (typeof message === 'string' && message) return message
    }
  }
  return fallback
}
