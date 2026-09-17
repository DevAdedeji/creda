type Sabilytics = {
  track: (name: string, properties?: Record<string, string>) => void
}

type AnalyticsWindow = Window & { sabilytics?: Sabilytics }

export function isAnalyticsEnabled(hostname: string): boolean {
  return !import.meta.dev && (hostname === 'creda.ng' || hostname === 'www.creda.ng')
}

export function trackAnalyticsEvent(name: string, properties?: Record<string, string>): void {
  if (!import.meta.client || !isAnalyticsEnabled(window.location.hostname)) return
  const analyticsWindow = window as AnalyticsWindow

  const send = () => {
    try {
      analyticsWindow.sabilytics?.track(name, properties)
    } catch {
      // Analytics must never interrupt signup or listing creation.
    }
  }

  if (analyticsWindow.sabilytics) {
    send()
    return
  }

  document
    .querySelector<HTMLScriptElement>('script[src="https://www.sabilytics.com/script.js"]')
    ?.addEventListener('load', send, { once: true })
}
