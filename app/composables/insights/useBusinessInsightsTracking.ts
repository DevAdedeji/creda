import type { Ref } from 'vue'
import type { InsightDestinationKey, InsightSurface } from '~~/shared/insights'
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
  }
  function recordClick(destination: InsightDestinationKey) {
    if (!mounted || !businessId.value || !permitted()) return
    sendBusinessInsight({ businessId: businessId.value, surface, action: 'click', destination })
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
