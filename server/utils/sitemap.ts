import { createError, getRequestURL, setHeader, type H3Event } from 'h3'
import { isProductionHost } from '~~/shared/site'

export const businessSitemapPageSize = 5000

export function assertProductionSitemap(event: H3Event): void {
  if (!isProductionHost(getRequestURL(event, { xForwardedHost: true }).hostname)) {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap not found.' })
  }
}

export function setSitemapHeaders(event: H3Event): void {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=300')
}

export function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[character]!,
  )
}
