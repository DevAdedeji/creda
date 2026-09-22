import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectHtml, sitemapLocations, auditSite } from './audit-seo.mjs'

const origin = 'https://creda.ng'
const page = (path, extra = '') =>
  `<html><head><title>Creda</title><meta content="Find > businesses" name="description"><link href="${origin}${path}" rel="canonical">${extra}<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script></head><body><h1>Explore businesses</h1></body></html>`

test('accepts SSR metadata regardless of attribute order and quoted greater-than characters', () => {
  assert.deepEqual(inspectHtml(page('/'), { canonical: origin + '/' }).failures, [])
})
test('catches page-two canonical regression, duplicate titles and malformed structured data', () => {
  const html = page('/').replace(
    '</head>',
    '<title>Duplicate</title><script type="application/ld+json">broken</script></head>',
  )
  const result = inspectHtml(html, { canonical: origin + '/explore?page=2' })
  assert.ok(result.failures.some((failure) => failure.includes('Canonical')))
  assert.ok(result.failures.some((failure) => failure.includes('title')))
  assert.ok(result.failures.includes('Invalid JSON-LD JSON'))
})
test('checks noindex in both HTTP headers and robots meta, with diagnostics rather than timing thresholds', () => {
  assert.ok(
    inspectHtml(page('/'), { canonical: origin + '/', robotsHeader: 'noindex' }).failures.includes(
      'Public page is noindex',
    ),
  )
  assert.deepEqual(
    inspectHtml(page('/login', '<meta name="robots" content="noindex, nofollow">'), {
      canonical: origin + '/login',
      indexable: false,
    }).failures,
    [],
  )
  const result = inspectHtml(
    page('/').replace(
      '</body>',
      '<img width="1920" height="384" src="/cover.jpg"><img src="/logo.png"></body>',
    ),
    { canonical: origin + '/' },
  )
  assert.equal(result.oversizedFixedImages, 1)
  assert.equal(result.unsizedImages, 1)
})
test('sitemap URLs decode XML entities and reject other origins', () => {
  assert.equal(
    sitemapLocations(
      '<urlset><url><loc>https://creda.ng/explore?page=2&amp;sort=name</loc></url></urlset>',
      origin,
    )[0].search,
    '?page=2&sort=name',
  )
  assert.throws(
    () => sitemapLocations('<urlset><loc>https://unrelated.test/</loc></urlset>', origin),
    /unexpected origin/,
  )
  assert.throws(() => sitemapLocations('<html>Unavailable</html>', origin), /Expected a sitemap/)
})
test('HTTP audit follows bounded sitemap indexes, checks sampled pages and private routes without following redirects', async () => {
  const paths = []
  const request = async (url, options) => {
    const path = url.pathname + url.search
    paths.push(path)
    assert.equal(options.redirect, 'manual')
    if (path === '/robots.txt') return new Response('Sitemap: https://creda.ng/sitemap.xml')
    if (path === '/sitemap.xml')
      return new Response(
        '<sitemapindex><loc>https://creda.ng/sitemap-pages.xml</loc></sitemapindex>',
      )
    if (path === '/sitemap-pages.xml')
      return new Response(
        '<urlset><loc>https://creda.ng/</loc><loc>https://creda.ng/businesses/example</loc></urlset>',
      )
    if (path.startsWith('/businesses/seo-audit-missing-'))
      return new Response('Not found', { status: 404 })
    return new Response(
      page(path, path === '/login' ? '<meta name="robots" content="noindex">' : ''),
    )
  }
  const results = await auditSite({ origin }, request)
  assert.deepEqual(
    results.flatMap((result) => result.failures),
    [],
  )
  assert.ok(paths.includes('/businesses/example'))
  assert.ok(paths.includes('/explore?page=2'))
})

test('private audit accepts absent sitemap and tests public routes protected by noindex headers', async () => {
  const paths = []
  const request = async (url) => {
    const path = url.pathname + url.search
    paths.push(path)
    const headers = { 'x-robots-tag': 'noindex, nofollow' }
    if (path === '/robots.txt') return new Response('User-agent: *\nAllow: /\n', { headers })
    if (path === '/sitemap.xml' || path.startsWith('/businesses/seo-audit-missing-'))
      return new Response('Not found', { status: 404, headers })
    return new Response(page(path), { headers })
  }
  const results = await auditSite({ origin, indexable: false }, request)
  assert.deepEqual(
    results.flatMap((result) => result.failures),
    [],
  )
  assert.ok(paths.includes('/explore'))
  assert.ok(paths.includes('/login'))
  assert.equal(paths.filter((path) => path.includes('sitemap')).length, 1)
})

test('private audit rejects exposed sitemap and missing nonproduction noindex headers', async () => {
  const request = async (url) => {
    if (url.pathname === '/robots.txt') return new Response('Sitemap: https://creda.ng/sitemap.xml')
    if (url.pathname === '/sitemap.xml')
      return new Response('<urlset><loc>https://creda.ng/</loc></urlset>')
    if (url.pathname.startsWith('/businesses/seo-audit-missing-'))
      return new Response('Not found', { status: 404 })
    return new Response(page(url.pathname + url.search))
  }
  const failures = (await auditSite({ origin, indexable: false }, request)).flatMap(
    (result) => result.failures,
  )
  assert.ok(failures.includes('Private robots.txt must not advertise a sitemap'))
  assert.ok(failures.includes('Private sitemap must return HTTP 404'))
  assert.ok(failures.includes('Private page must have X-Robots-Tag: noindex'))
})

test('noindex login may omit canonical but must not declare a wrong or duplicate canonical', () => {
  const options = { canonical: origin + '/login', canonicalRequired: false, indexable: false }
  const html = page('/login', '<meta name="robots" content="noindex">')
  assert.deepEqual(inspectHtml(html.replace(/<link[^>]+>/, ''), options).failures, [])
  assert.ok(
    inspectHtml(
      html.replace('href="https://creda.ng/login"', 'href="https://creda.ng/"'),
      options,
    ).failures.some((failure) => failure.includes('Canonical')),
  )
  assert.ok(
    inspectHtml(
      html.replace('</head>', '<link rel="canonical" href="https://creda.ng/login"></head>'),
      options,
    ).failures.some((failure) => failure.includes('Canonical')),
  )
  assert.ok(
    inspectHtml(
      html.replace('<meta name="robots" content="noindex">', ''),
      options,
    ).failures.includes('Private page must be noindex'),
  )
})
