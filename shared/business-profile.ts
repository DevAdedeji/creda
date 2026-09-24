import { z } from 'zod'
import type { BusinessCategory, OperationMode } from './businesses'

export const MAX_OFFERINGS = 8
export const MAX_FAQS = 8
export const priceCurrencies = ['NGN', 'USD', 'GBP', 'EUR'] as const
export const priceUnits = [
  { value: 'once', label: 'One-time' },
  { value: 'item', label: 'Per item' },
  { value: 'session', label: 'Per session' },
  { value: 'hour', label: 'Per hour' },
  { value: 'day', label: 'Per day' },
  { value: 'month', label: 'Per month' },
  { value: 'year', label: 'Per year' },
] as const
const priceAmount = {
  amountMinor: z.number().int().min(0).max(100_000_000_000),
  currency: z.enum(priceCurrencies),
  unit: z.enum(['once', 'item', 'session', 'hour', 'day', 'month', 'year']),
}
export const offeringSchema = z.strictObject({
  name: z.string().trim().min(2, 'Give this offering a name.').max(80),
  kind: z.enum(['service', 'product']),
  description: z.string().trim().max(300),
  price: z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('unspecified') }),
    z.strictObject({ type: z.literal('quote') }),
    z.strictObject({ type: z.literal('fixed'), ...priceAmount }),
    z.strictObject({ type: z.literal('from'), ...priceAmount }),
  ]),
})
export const practicalKeys = [
  'delivery',
  'pickup',
  'appointments',
  'walkIns',
  'onlineConsultations',
  'wheelchairAccess',
  'parking',
  'cash',
  'bankTransfer',
  'cards',
  'freeTrial',
  'freePlan',
  'subscription',
] as const
export type PracticalKey = (typeof practicalKeys)[number]
interface PracticalField {
  key: PracticalKey
  label: string
  icon: string
  inPerson?: boolean
  categories?: readonly BusinessCategory[]
}
export const practicalFields: readonly PracticalField[] = [
  {
    key: 'delivery',
    label: 'Delivery',
    icon: 'i-lucide-truck',
    categories: ['retail', 'food', 'pets', 'other'],
  },
  {
    key: 'pickup',
    label: 'Pickup',
    icon: 'i-lucide-shopping-bag',
    categories: ['retail', 'food', 'pets', 'other'],
  },
  {
    key: 'appointments',
    label: 'Appointments',
    icon: 'i-lucide-calendar-days',
    categories: [
      'creative',
      'services',
      'home_services',
      'health',
      'beauty',
      'automotive',
      'education',
      'fitness',
      'pets',
      'other',
    ],
  },
  { key: 'walkIns', label: 'Walk-ins', icon: 'i-lucide-footprints', inPerson: true },
  {
    key: 'onlineConsultations',
    label: 'Online consultations',
    icon: 'i-lucide-video',
    categories: ['creative', 'services', 'health', 'education', 'fitness', 'finance', 'other'],
  },
  {
    key: 'wheelchairAccess',
    label: 'Wheelchair-accessible entrance',
    icon: 'i-lucide-accessibility',
    inPerson: true,
  },
  { key: 'parking', label: 'Parking', icon: 'i-lucide-square-parking', inPerson: true },
  { key: 'cash', label: 'Cash payments', icon: 'i-lucide-banknote' },
  { key: 'bankTransfer', label: 'Bank transfers', icon: 'i-lucide-landmark' },
  { key: 'cards', label: 'Card payments', icon: 'i-lucide-credit-card' },
  { key: 'freeTrial', label: 'Free trial', icon: 'i-lucide-timer', categories: ['software'] },
  { key: 'freePlan', label: 'Free plan', icon: 'i-lucide-gift', categories: ['software'] },
  {
    key: 'subscription',
    label: 'Subscription plans',
    icon: 'i-lucide-repeat',
    categories: ['software', 'fitness', 'education'],
  },
]
export function suggestedPracticalFields(
  category: BusinessCategory,
  mode: OperationMode,
  saved: BusinessProfileDetails['practical'],
) {
  return practicalFields.filter(
    (field) =>
      saved[field.key] !== undefined ||
      ((!field.inPerson || mode !== 'online') &&
        (!field.categories || field.categories.includes(category))),
  )
}
const uniqueNames = (values: string[]) =>
  new Set(values.map((value) => value.normalize('NFKC').replace(/\s+/g, ' ').toLowerCase()))
    .size === values.length
export const businessProfileDetailsSchema = z.strictObject({
  offerings: z
    .array(offeringSchema)
    .max(MAX_OFFERINGS)
    .refine(
      (items) => uniqueNames(items.map((item) => item.name)),
      'Give each offering a different name.',
    ),
  practical: z.partialRecord(z.enum(practicalKeys), z.enum(['yes', 'no'])),
  faqs: z
    .array(
      z.strictObject({
        question: z.string().trim().min(5, 'Add a complete question.').max(160),
        answer: z.string().trim().min(2, 'Add an answer.').max(600),
      }),
    )
    .max(MAX_FAQS)
    .refine(
      (items) => uniqueNames(items.map((item) => item.question)),
      'Add each question only once.',
    ),
})
export type BusinessProfileDetails = z.infer<typeof businessProfileDetailsSchema>
export type BusinessOffering = z.infer<typeof offeringSchema>
export interface BusinessProfileSource {
  url: string
  reviewedAt: string
}
export interface BusinessProfileDetailsResponse {
  details: BusinessProfileDetails
  revision: number
}
export const businessProfileUpdateSchema = z.strictObject({
  details: businessProfileDetailsSchema,
  revision: z.number().int().min(0),
})
export function emptyBusinessProfile(): BusinessProfileDetails {
  return { offerings: [], practical: {}, faqs: [] }
}

// Convert decimal input without storing a floating-point monetary value.
export function priceToMinor(value: string): number | null {
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(value.trim())) return null
  const [whole = '', fraction = ''] = value.trim().split('.')
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(amount) && amount <= 100_000_000_000 ? amount : null
}
export function offeringPriceLabel(price: BusinessOffering['price']): string {
  if (price.type === 'unspecified') return ''
  if (price.type === 'quote') return 'Request a quote'
  const amount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: 2,
  }).format(price.amountMinor / 100)
  return `${price.type === 'from' ? 'From ' : ''}${amount}${price.unit === 'once' ? '' : ` / ${price.unit}`}`
}
