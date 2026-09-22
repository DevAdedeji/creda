import { count, eq } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business } from '~~/lib/db/schema'
import { productionOrigin } from '~~/shared/site'
import {
  assertProductionSitemap,
  businessSitemapPageSize,
  escapeXml,
  setSitemapHeaders,
} from '@server/utils/sitemap'

export default defineEventHandler(async (event) => {
  assertProductionSitemap(event)
  const [result] = await db
    .select({ total: count() })
    .from(business)
    .where(eq(business.status, 'approved'))
  const pages = Math.ceil((result?.total ?? 0) / businessSitemapPageSize)
  const paths = [
    '/sitemap-static.xml',
    '/sitemap-categories.xml',
    '/sitemap-locations.xml',
    ...Array.from({ length: pages }, (_, index) => `/sitemap-businesses.xml?page=${index + 1}`),
  ]

  setSitemapHeaders(event)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
    .map(
      (path) =>
        `<sitemap><loc>${escapeXml(new URL(path, productionOrigin).toString())}</loc></sitemap>`,
    )
    .join('')}</sitemapindex>`
})
