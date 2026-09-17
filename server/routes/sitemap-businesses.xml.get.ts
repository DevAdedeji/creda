import { asc, eq } from 'drizzle-orm'
import { createError, getQuery } from 'h3'
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
  const page = getQuery(event).page
  if (typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page))) {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap not found.' })
  }
  const offset = (Number(page) - 1) * businessSitemapPageSize
  if (!Number.isSafeInteger(offset)) {
    throw createError({ statusCode: 404, statusMessage: 'Sitemap not found.' })
  }

  const listings = await db
    .select({ slug: business.slug, updatedAt: business.updatedAt })
    .from(business)
    .where(eq(business.status, 'approved'))
    .orderBy(asc(business.createdAt), asc(business.id))
    .limit(businessSitemapPageSize)
    .offset(offset)
  if (!listings.length) throw createError({ statusCode: 404, statusMessage: 'Sitemap not found.' })

  setSitemapHeaders(event)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${listings
    .map(
      ({ slug, updatedAt }) =>
        `<url><loc>${escapeXml(new URL(`/businesses/${encodeURIComponent(slug)}`, productionOrigin).toString())}</loc><lastmod>${updatedAt.toISOString()}</lastmod></url>`,
    )
    .join('')}</urlset>`
})
