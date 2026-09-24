import { trackAnalyticsEvent } from '@/utils/analytics'

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  let lastPath: string | undefined
  function recordPage() {
    const path = router.currentRoute.value.path
    if (path === lastPath) return
    lastPath = path
    if (path === '/') trackAnalyticsEvent('homepage_viewed')
    else if (/^\/(explore|categories|locations)(\/|$)/.test(path)) {
      trackAnalyticsEvent('directory_viewed', { surface: path.split('/')[1]! })
    }
  }
  nuxtApp.hook('app:mounted', recordPage)
  nuxtApp.hook('page:finish', recordPage)
})
