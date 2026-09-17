import { getRequestURL, setHeader } from 'h3'
import { isProductionHost, productionOrigin } from '~~/shared/site'

export default defineEventHandler((event) => {
  const hostname = getRequestURL(event, { xForwardedHost: true }).hostname
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  if (!isProductionHost(hostname)) return 'User-agent: *\nAllow: /\n'
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    `Sitemap: ${new URL('/sitemap.xml', productionOrigin)}`,
    '',
  ].join('\n')
})
