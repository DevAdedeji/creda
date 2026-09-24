import assert from 'node:assert/strict'
import { test } from 'node:test'
import { curatedBusinesses } from '../scripts/data/curated-businesses.mjs'
import { curatedLogoUrls } from '../scripts/data/curated-logo-urls.mjs'
import { curatedContactUrl, curatedLogoUrl } from '../scripts/lib/curated-business-links.mjs'
import { businessCategories } from '../shared/businesses.ts'

const hosted =
  'https://cdn.byteship.cloud/f/project/businesses/curated/logos/example-0123456789abcdef.png'

test('logo decisions distinguish an intentional avatar from a missing asset', () => {
  assert.equal(curatedLogoUrl('example', { example: null }), null)
  assert.equal(curatedLogoUrl('example', { example: hosted }), hosted)
  assert.throws(() => curatedLogoUrl('example', {}), /Missing logo decision/)
  for (const value of [
    '',
    undefined,
    hosted.replace('example-', 'another-'),
    hosted.replace('.png', 'xpng'),
    hosted.replace('cdn.byteship.cloud', 'example.com'),
  ]) {
    assert.throws(() => curatedLogoUrl('example', { example: value }))
  }
})

test('contact links support official HTTPS pages and international telephone links only', () => {
  assert.equal(curatedContactUrl(undefined), null)
  assert.equal(curatedContactUrl('tel:+2347088667382'), 'tel:+2347088667382')
  assert.equal(curatedContactUrl('https://example.com/contact'), 'https://example.com/contact')
  for (const value of [
    'javascript:alert(1)',
    'http://example.com',
    'tel:08012345678',
    'tel:+234',
    'https://user:secret@example.com',
  ]) {
    assert.throws(() => curatedContactUrl(value))
  }
})

test('catalogue has unique identities, valid categories and an explicit logo choice for every business', () => {
  const categories = new Set(businessCategories.map((item) => item.value))
  assert.deepEqual(
    Object.keys(curatedLogoUrls).sort(),
    curatedBusinesses.map((item) => item.slug).sort(),
  )
  for (const values of [
    curatedBusinesses.map((item) => item.slug),
    curatedBusinesses.map((item) => item.name.toLowerCase().trim()),
    curatedBusinesses.map((item) => new URL(item.websiteUrl).hostname.replace(/^www\./, '')),
  ]) {
    assert.equal(new Set(values).size, values.length)
  }
  for (const item of curatedBusinesses) {
    assert.ok(categories.has(item.category), item.slug)
    curatedLogoUrl(item.slug, curatedLogoUrls)
    curatedContactUrl(item.contactUrl)
  }
})
