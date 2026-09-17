import { getRequestURL, setHeader } from 'h3'
import { isProductionHost } from '~~/shared/site'

export default defineEventHandler((event) => {
  const hostname = getRequestURL(event, { xForwardedHost: true }).hostname
  if (!isProductionHost(hostname)) setHeader(event, 'x-robots-tag', 'noindex, nofollow')
})
