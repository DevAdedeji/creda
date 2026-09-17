import { getRequestURL, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const origin =
    process.env.NUXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || getRequestURL(event).origin
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /account',
    'Disallow: /admin/',
    'Disallow: /dashboard/',
    'Disallow: /login',
    'Disallow: /signup',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    `Sitemap: ${new URL('/sitemap.xml', origin)}`,
    '',
  ].join('\n')
})
