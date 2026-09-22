import assert from 'node:assert/strict'

const origin = process.argv[2]
if (!origin)
  throw new Error(
    'Pass the running test server URL: node tests/seo/explore-http.mjs http://localhost:4002',
  )

async function page(path, expectedStatus) {
  const response = await fetch(new URL(path, origin))
  assert.equal(response.status, expectedStatus, path)
  const html = await response.text()
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1]
  const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1]
  return { html, canonical, robots }
}

const first = await page('/explore', 200)
assert.equal(first.robots, 'index, follow')
assert.equal(new URL(first.canonical).pathname, '/explore')
assert.equal(new URL(first.canonical).search, '')

const equivalent = await page('/explore?page=1&utm_source=seo-test', 200)
assert.equal(equivalent.canonical, first.canonical)

const listing = await fetch(new URL('/api/businesses', origin)).then((response) => response.json())
if (listing.total > listing.pageSize) {
  const second = await page('/explore?page=2', 200)
  assert.equal(second.robots, 'index, follow')
  assert.equal(new URL(second.canonical).search, '?page=2')
  assert.match(second.html, /Explore businesses — Page 2 — Creda/)
  assert.match(second.html, /href="\/explore"/)
}

for (const query of [
  'q=seo-no-results-xyz',
  'category=software',
  'sort=newest',
  'mode=ai&q=fintech',
  'unknown=test',
]) {
  const result = await page(`/explore?${query}`, 200)
  assert.equal(result.robots, 'noindex, follow', query)
  assert.equal(result.canonical, undefined, query)
}

for (const value of ['0', '-1', 'abc', '01', '1.5', '10001', '2&page=3']) {
  const result = await page(`/explore?page=${value}`, 404)
  assert.equal(result.robots, 'noindex, follow', value)
  assert.equal(result.canonical, undefined, value)
  assert.match(result.html, /This page isn’t available/)
  assert.match(result.html, /Go to the first page/)
}
const nonexistentPage = Math.ceil(listing.total / listing.pageSize) + 2
const missing = await page(`/explore?page=${nonexistentPage}`, 404)
assert.equal(missing.robots, 'noindex, follow')
assert.match(missing.html, /This page isn’t available/)

// A failed request must not leak response status or metadata into later requests.
assert.equal((await page('/explore', 200)).robots, 'index, follow')
const sitemap = await fetch(new URL('/sitemap-static.xml', origin), {
  headers: { 'x-forwarded-host': 'creda.ng' },
})
assert.equal(sitemap.status, 200)
const sitemapXml = await sitemap.text()
assert.match(sitemapXml, /<loc>https:\/\/creda\.ng\/explore<\/loc>/)
assert.doesNotMatch(sitemapXml, /[?&](page|q|category|intent)=/)

console.log(
  'Directory HTTP SEO checks passed: canonical pagination, variants, invalid pages, empty results, recovery.',
)
