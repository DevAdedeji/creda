export function useCanonicalUrl(path: string) {
  const configuredUrl = useRuntimeConfig().public.siteUrl
  const origin = configuredUrl || useRequestURL().origin
  return new URL(path, origin).toString()
}
