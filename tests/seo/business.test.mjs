import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  businessStructuredData,
  businessPageDescription,
  businessPageTitle,
  businessReviewStructuredData,
} from '../../app/utils/seo/business.ts'
import { serializeJsonLd } from '../../app/utils/jsonLd.ts'

const business = {
  id: 'business-1',
  slug: 'studio',
  name: 'Studio',
  description: 'A creative studio.',
  category: 'creative',
  operationMode: 'physical',
  location: '12 Studio Road',
  city: 'Ikeja',
  state: 'Lagos',
  serviceArea: null,
  openingHours: null,
  weeklyHours: [{ day: 1, start: '09:00', end: '17:30' }],
  hoursTimeZone: 'Africa/Lagos',
  services: [],
  googlePlaceId: null,
  websiteUrl: 'https://studio.example',
  appStoreUrl: null,
  playStoreUrl: null,
  socialUrl: null,
  contactUrl: 'tel:+2348012345678',
  logoUrl: null,
  coverUrl: null,
  galleryUrls: [],
  ownershipStatus: 'unverified',
  listingSource: 'member',
  publishedAt: '2026-09-22T00:00:00Z',
}
const canonical = 'https://creda.ng/businesses/studio'
const review = {
  id: 'review-1',
  authorName: 'Ada',
  isAnonymous: false,
  rating: 5,
  body: 'I enjoyed working with this studio.',
  photoUrls: [],
  experienceMonth: '2026-09',
  createdAt: '2026-09-22T00:00:00Z',
  updatedAt: '2026-09-22T00:00:00Z',
  reply: null,
  votes: { usefulCount: 0, notUsefulCount: 0, myVote: null },
}
const reviewData = {
  averageRating: 4.25,
  reviewCount: 4,
  reviews: [review],
  page: 1,
  totalPages: 2,
  myReview: null,
  canReview: false,
  reviewBlocked: false,
  isOwner: false,
}
const identity = { name: 'Studio', canonicalUrl: canonical, type: 'LocalBusiness' }

test('a physical business has only its listed address, contact and weekly schedule', () => {
  const schema = businessStructuredData(business, canonical)
  assert.equal(schema['@type'], 'LocalBusiness')
  assert.deepEqual(schema.address, {
    '@type': 'PostalAddress',
    streetAddress: '12 Studio Road',
    addressLocality: 'Ikeja',
    addressRegion: 'Lagos',
  })
  assert.equal(schema.telephone, '+2348012345678')
  assert.equal(schema.openingHoursSpecification.length, 7)
  assert.equal(schema.openingHoursSpecification[0].opens, '09:00:00')
  assert.equal(schema.openingHoursSpecification[1].opens, '00:00:00')
  assert.equal(schema.openingHoursSpecification[1].closes, '00:00:00')
  assert.equal(schema.areaServed, undefined)
  assert.equal(schema.geo, undefined)
})

test('online businesses with a headquarters address are not presented as a visitor location', () => {
  const schema = businessStructuredData({ ...business, operationMode: 'online' }, canonical)
  assert.equal(schema['@type'], 'Organization')
  assert.equal(schema.address.streetAddress, business.location)
  assert.equal(schema.openingHoursSpecification, undefined)
})

test('no local address or hours are fabricated for incomplete listings', () => {
  const schema = businessStructuredData({ ...business, location: null, weeklyHours: [] }, canonical)
  assert.equal(schema['@type'], 'Organization')
  assert.equal(schema.address, undefined)
  assert.equal(schema.openingHoursSpecification, undefined)
})

test('subtypes reflect the known broad category without assuming restaurants or hotels', () => {
  assert.equal(
    businessStructuredData({ ...business, category: 'retail' }, canonical)['@type'],
    'Store',
  )
  assert.equal(
    businessStructuredData({ ...business, category: 'food' }, canonical)['@type'],
    'LocalBusiness',
  )
})

test('review markup uses the visible aggregate and the current review page only', () => {
  const schema = businessReviewStructuredData(identity, reviewData)
  assert.equal(schema.aggregateRating.ratingValue, 4.3)
  assert.equal(schema.aggregateRating.reviewCount, 4)
  assert.equal(schema.review.length, 1)
  assert.equal(schema.review[0].author.name, 'Ada')
  assert.equal(schema['@id'], `${canonical}#business`)
})

test('anonymous identities and bodies never enter individual review markup', () => {
  const schema = businessReviewStructuredData(identity, {
    ...reviewData,
    reviews: [{ ...review, isAnonymous: true, authorName: 'Private Name', body: 'Anonymous body' }],
  })
  assert.equal(schema.aggregateRating.reviewCount, 4)
  assert.equal(schema.review, undefined)
  assert.equal(JSON.stringify(schema).includes('Private Name'), false)
  assert.equal(JSON.stringify(schema).includes('Anonymous body'), false)
})

test('empty reviews do not create zero-star ratings or placeholder authors', () => {
  assert.equal(
    businessReviewStructuredData(identity, {
      ...reviewData,
      reviews: [],
      reviewCount: 0,
      averageRating: null,
    }),
    null,
  )
  assert.equal(
    businessReviewStructuredData(identity, {
      ...reviewData,
      reviews: [{ ...review, authorName: '' }],
    }).review,
    undefined,
  )
})

test('metadata describes the review page without inventing ratings and safely encodes submitted text', () => {
  assert.match(businessPageTitle(business), /Business Details & Customer Reviews/)
  assert.match(businessPageDescription(business), /Ikeja, Lagos/)
  assert.equal(
    businessPageDescription({ ...business, description: 'Long '.repeat(100) }).length <= 160,
    true,
  )
  const unsafe = { ...business, name: '</script><script>alert(1)</script>' }
  assert.equal(
    serializeJsonLd(businessStructuredData(unsafe, canonical)).includes('</script>'),
    false,
  )
})
