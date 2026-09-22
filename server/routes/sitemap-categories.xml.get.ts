import { getCategorySummaries } from '@server/domains/categories/service'
import { categoryPath } from '~~/shared/seo/categories'
import { productionOrigin } from '~~/shared/site'
import { assertProductionSitemap, escapeXml, setSitemapHeaders } from '@server/utils/sitemap'

export default defineEventHandler(async (event) => {
  assertProductionSitemap(event)
  const categories = await getCategorySummaries()
  const paths = [
    '/categories',
    ...categories
      .filter((category) => category.total > 0)
      .map((category) => categoryPath(category.value)),
  ]
  setSitemapHeaders(event)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escapeXml(new URL(path, productionOrigin).toString())}</loc></url>`).join('')}</urlset>`
})
