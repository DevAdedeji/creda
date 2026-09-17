import { isProductionHost, productionOrigin } from '~~/shared/site'

export function useCanonicalUrl(path: string) {
  const configuredUrl = useRuntimeConfig().public.siteUrl
  const requestUrl = useRequestURL()
  const origin = isProductionHost(requestUrl.hostname)
    ? productionOrigin
    : configuredUrl || requestUrl.origin
  return new URL(path, origin).toString()
}
