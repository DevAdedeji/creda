import { getLocationGroups } from '@server/domains/locations/service'
import { locationRequest } from '@server/domains/locations/http'
import { locationSitemapPaths } from '~~/shared/seo/locations'
import { productionOrigin } from '~~/shared/site'
import { assertProductionSitemap, escapeXml, setSitemapHeaders } from '@server/utils/sitemap'
export default defineEventHandler(async (event) => {
  assertProductionSitemap(event)
  const groups = await locationRequest('sitemap', getLocationGroups)
  setSitemapHeaders(event)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locationSitemapPaths(
    groups,
  )
    .map((path) => `<url><loc>${escapeXml(new URL(path, productionOrigin).toString())}</loc></url>`)
    .join('')}</urlset>`
})
