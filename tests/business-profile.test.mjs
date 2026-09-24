import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  businessProfileDetailsSchema,
  emptyBusinessProfile,
  priceToMinor,
  offeringPriceLabel,
  suggestedPracticalFields,
} from '../shared/business-profile.ts'
const offering = (price = { type: 'unspecified' }) => ({
  name: 'Portrait session',
  kind: 'service',
  description: 'One hour in our studio.',
  price,
})

test('empty profiles stay empty and unknown details are not treated as no', () => {
  assert.deepEqual(businessProfileDetailsSchema.parse(emptyBusinessProfile()), {
    offerings: [],
    practical: {},
    faqs: [],
  })
  assert.deepEqual(
    businessProfileDetailsSchema.parse({
      ...emptyBusinessProfile(),
      practical: { delivery: 'no', cards: 'yes' },
    }).practical,
    { delivery: 'no', cards: 'yes' },
  )
})
test('money input converts exact decimals and rejects invalid or oversized amounts', () => {
  assert.equal(priceToMinor('0.29'), 29)
  assert.equal(priceToMinor('25000.01'), 2500001)
  assert.equal(priceToMinor('0'), 0)
  for (const value of ['', '-5', 'NaN', '1e3', '10.999', '1000000001', '2,000'])
    assert.equal(priceToMinor(value), null, value)
})
test('fixed, from and quote pricing remain distinct', () => {
  const fixed = { type: 'fixed', amountMinor: 1250050, currency: 'NGN', unit: 'session' }
  assert.match(offeringPriceLabel(fixed), /12,500.50.*session/)
  assert.match(offeringPriceLabel({ ...fixed, type: 'from' }), /^From /)
  assert.equal(offeringPriceLabel({ type: 'quote' }), 'Request a quote')
  assert.equal(offeringPriceLabel({ type: 'unspecified' }), '')
})
test('prices require an exact nonnegative minor amount and known currency', () => {
  for (const price of [
    { type: 'fixed', amountMinor: -1, currency: 'NGN', unit: 'once' },
    { type: 'fixed', amountMinor: 0.5, currency: 'NGN', unit: 'once' },
    { type: 'from', amountMinor: 500, currency: 'FAKE', unit: 'once' },
    { type: 'quote', amountMinor: 0 },
  ])
    assert.equal(
      businessProfileDetailsSchema.safeParse({
        ...emptyBusinessProfile(),
        offerings: [offering(price)],
      }).success,
      false,
    )
})
test('profiles reject excess entries, duplicate names, blank answers and unknown attributes', () => {
  const cases = [
    { offerings: Array.from({ length: 9 }, (_, i) => ({ ...offering(), name: `Service ${i}` })) },
    { offerings: [offering(), { ...offering(), name: ' PORTRAIT SESSION ' }] },
    { faqs: [{ question: 'How do I book?', answer: ' ' }] },
    {
      faqs: [
        { question: 'How do I book?', answer: 'Call us.' },
        { question: 'HOW DO I BOOK?', answer: 'Online.' },
      ],
    },
    {
      faqs: Array.from({ length: 9 }, (_, i) => ({
        question: `Question ${i}?`,
        answer: 'Answer here.',
      })),
    },
    { practical: { delivery: true } },
    { practical: { invented: 'yes' } },
    { ownerUserId: 'another-user' },
  ]
  for (const value of cases)
    assert.equal(
      businessProfileDetailsSchema.safeParse({ ...emptyBusinessProfile(), ...value }).success,
      false,
    )
})
test('category suggestions preserve saved values but avoid irrelevant empty fields', () => {
  const software = suggestedPracticalFields('software', 'online', {})
  assert.ok(software.some((field) => field.key === 'freeTrial'))
  assert.ok(!software.some((field) => field.key === 'wheelchairAccess'))
  assert.ok(!software.some((field) => field.key === 'delivery'))
  assert.ok(
    suggestedPracticalFields('software', 'online', { delivery: 'yes' }).some(
      (field) => field.key === 'delivery',
    ),
  )
  assert.ok(
    suggestedPracticalFields('beauty', 'physical', {}).some(
      (field) => field.key === 'appointments',
    ),
  )
})
