import type { Ref } from 'vue'
import type { InsightDestinationKey, InsightSurface } from '~~/shared/insights'
import { trackAnalyticsEvent } from '@/utils/analytics'
import { sendBusinessInsight } from '@/services/insights'

export function useBusinessInsightsTracking(
  businessId: Readonly<Ref<string | undefined>>,
  surface: InsightSurface,
) {
  let lastViewed: string | undefined
  let mounted = false
  function permitted(): boolean {
    return (
      navigator.doNotTrack !== '1' &&
      !('globalPrivacyControl' in navigator && navigator.globalPrivacyControl === true)
    )
  }
  function recordView() {
    const id = businessId.value
    if (
      !mounted ||
      !id ||
      document.visibilityState !== 'visible' ||
      !permitted() ||
      id === lastViewed
    )
      return
    lastViewed = id
    sendBusinessInsight({ businessId: id, surface, action: 'view' })
    trackAnalyticsEvent('business_viewed', { business_id: id, surface })
  }
  function recordClick(destination: InsightDestinationKey) {
    if (!mounted || !businessId.value || !permitted()) return
    sendBusinessInsight({ businessId: businessId.value, surface, action: 'click', destination })
    trackAnalyticsEvent('business_link_clicked', {
      business_id: businessId.value,
      surface,
      destination,
    })
  }
  onMounted(() => {
    mounted = true
    recordView()
    document.addEventListener('visibilitychange', recordView)
  })
  watch(businessId, recordView)
  onBeforeUnmount(() => {
    mounted = false
    document.removeEventListener('visibilitychange', recordView)
  })
  return { recordClick }
}
