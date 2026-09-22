import assert from 'node:assert/strict'
import test from 'node:test'

const origin = process.env.CREDA_TEST_ORIGIN || 'http://localhost:4002'
const pages = [
  ['/about', 'About Creda'],
  ['/contact', 'Contact &amp; help'],
  ['/help/reviews', 'Review guidelines'],
  ['/help/ownership', 'Ownership verification'],
]

async function request(path) {
  return fetch(new URL(path, origin), { signal: AbortSignal.timeout(30_000) })
}

for (const [path, heading] of pages) {
  test(`${path} renders a public page with a canonical, navigation and working help links`, async () => {
    const response = await request(path)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, new RegExp(`<h1[^>]*>\\s*${heading}\\s*</h1>`))
    assert.match(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="[^"]*${path}"`))
    assert.match(html, /<main\b/)
    assert.match(html, /<footer\b/)
    for (const [destination] of pages) assert.ok(html.includes(`href="${destination}"`))
    assert.ok(!html.includes('mailto:no-reply'))
  })
}

test('review guidance clearly distinguishes public anonymity from account identity', async () => {
  const html = await (await request('/help/reviews')).text()
  assert.match(html, /Creda retains the account connection/)
  assert.match(html, /Reports are private and do not automatically remove content/)
})

test('related businesses exclude the current profile, share its category and expose only public information', async (context) => {
  const directoryResponse = await request('/api/businesses')
  assert.equal(directoryResponse.status, 200)
  const directory = await directoryResponse.json()
  const source = directory.items[0]
  if (!source) return context.skip('This database has no published businesses to compare.')
  const response = await request(`/api/businesses/${encodeURIComponent(source.slug)}/related`)
  assert.equal(response.status, 200)
  const { items } = await response.json()
  assert.ok(Array.isArray(items))
  assert.ok(items.length <= 3)
  assert.equal(new Set(items.map((item) => item.id)).size, items.length)
  for (const item of items) {
    assert.notEqual(item.id, source.id)
    assert.equal(item.category, source.category)
    for (const privateField of [
      'ownerUserId',
      'ownerEmail',
      'rejectionReason',
      'reviewedByUserId',
    ]) {
      assert.ok(!(privateField in item))
    }
    assert.equal((await request(`/api/businesses/${encodeURIComponent(item.slug)}`)).status, 200)
  }
  const html = await (await request(`/businesses/${encodeURIComponent(source.slug)}`)).text()
  assert.match(html, /<footer\b/)
  for (const item of items) assert.ok(html.includes(`href="/businesses/${item.slug}"`))
})

test('invalid or unavailable source profiles cannot return related listings', async () => {
  assert.equal((await request('/api/businesses/not_a_valid_slug/related')).status, 404)
  assert.equal(
    (await request('/api/businesses/seo-credibility-no-such-business-836731/related')).status,
    404,
  )
})
