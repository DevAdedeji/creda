import { eq } from 'drizzle-orm'
import { getRequestURL, setHeader } from 'h3'
import { db } from '~~/lib/db'
import { business } from '~~/lib/db/schema'

function escapeXml(value: string) {
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

export default defineEventHandler(async (event) => {
  const origin =
    process.env.NUXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || getRequestURL(event).origin
  const listings = await db
    .select({ slug: business.slug, updatedAt: business.updatedAt })
    .from(business)
    .where(eq(business.status, 'approved'))

  const urls = [
    { path: '/', updatedAt: null },
    { path: '/businesses', updatedAt: null },
    ...listings.map(({ slug, updatedAt }) => ({
      path: `/businesses/${encodeURIComponent(slug)}`,
      updatedAt,
    })),
  ]

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=300')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map(
      ({ path, updatedAt }) =>
        `<url><loc>${escapeXml(new URL(path, origin).toString())}</loc>${updatedAt ? `<lastmod>${updatedAt.toISOString()}</lastmod>` : ''}</url>`,
    )
    .join('')}</urlset>`
})
