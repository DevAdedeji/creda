import { informationPages } from '~~/shared/information-pages'
import { productionOrigin } from '~~/shared/site'
import { assertProductionSitemap, escapeXml, setSitemapHeaders } from '@server/utils/sitemap'

export default defineEventHandler((event) => {
  assertProductionSitemap(event)
  setSitemapHeaders(event)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
    '/',
    '/explore',
    ...informationPages.map((page) => page.path),
  ]
    .map((path) => `<url><loc>${escapeXml(new URL(path, productionOrigin).toString())}</loc></url>`)
    .join('')}</urlset>`
})
