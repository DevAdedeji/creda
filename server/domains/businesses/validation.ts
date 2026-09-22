import { z } from 'zod'
import {
  businessCategoryValues,
  businessLinkError,
  businessContactLinkMessage,
  isBusinessContactLink,
  operationModeValues,
} from '~~/shared/businesses'
import { isAvailableBusinessSlugFormat } from '~~/shared/business-slugs'

const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((value) => value.replace(/\s+/g, ' '))

const destinationUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
    } catch {
      return false
    }
  }, 'Enter a valid HTTP or HTTPS URL.')
  .transform((value) => {
    if (!value) return null
    const url = new URL(value)
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  })

export const businessSubmissionSchema = z
  .object({
    name: cleanText(2, 120),
    description: cleanText(30, 600),
    category: z.enum(businessCategoryValues),
    operationMode: z.enum(operationModeValues),
    location: z
      .string()
      .trim()
      .max(160)
      .transform((value) => value.replace(/\s+/g, ' ') || null),
    city: z
      .string()
      .trim()
      .max(100)
      .transform((value) => value.replace(/\s+/g, ' ') || null),
    state: z
      .string()
      .trim()
      .max(100)
      .transform((value) => value.replace(/\s+/g, ' ') || null),
    serviceArea: z
      .string()
      .trim()
      .max(160)
      .transform((value) => value.replace(/\s+/g, ' ') || null),
    openingHours: z
      .string()
      .trim()
      .max(160)
      .transform((value) => value.replace(/\s+/g, ' ') || null),
    weeklyHours: z
      .array(
        z.object({
          day: z.number().int().min(1).max(7),
          start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        }),
      )
      .max(7)
      .refine(
        (rows) => new Set(rows.map((row) => row.day)).size === rows.length,
        'Choose each day once.',
      )
      .refine(
        (rows) => rows.every((row) => row.start < row.end),
        'Closing time must be after opening time.',
      ),
    hoursTimeZone: z
      .string()
      .trim()
      .max(80)
      .transform((value) => value || null),
    services: z
      .array(cleanText(2, 80))
      .max(8)
      .refine(
        (values) => new Set(values.map(normalizedKey)).size === values.length,
        'List each service only once.',
      ),
    googlePlaceId: z
      .string()
      .trim()
      .max(255)
      .regex(/^[A-Za-z0-9:_-]*$/, 'Choose a Google Maps suggestion again.')
      .default('')
      .transform((value) => value || null),
    websiteUrl: destinationUrl,
    appStoreUrl: destinationUrl,
    playStoreUrl: destinationUrl,
    socialUrl: destinationUrl,
    contactUrl: z
      .string()
      .trim()
      .max(500)
      .refine(isBusinessContactLink, businessContactLinkMessage)
      .transform((value) => {
        if (!value) return null
        if (value.startsWith('tel:')) return value
        const url = new URL(value)
        url.hash = ''
        return url.toString().replace(/\/$/, '')
      }),
    logoUrl: destinationUrl,
    coverUrl: destinationUrl,
    galleryUrls: z
      .array(z.url().max(500))
      .max(8)
      .refine((urls) => new Set(urls).size === urls.length, 'Choose each gallery image only once.'),
    mediaProofs: z.array(z.string().max(2000)).max(10),
  })
  .superRefine((value, context) => {
    if (value.googlePlaceId && !value.location) {
      context.addIssue({
        code: 'custom',
        path: ['googlePlaceId'],
        message: 'A Google Maps place needs a location.',
      })
    }
    if (value.operationMode !== 'online' && (!value.location || value.location.length < 2)) {
      context.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Add a location for an in-person business.',
      })
    }
    if (value.operationMode !== 'online') {
      for (const field of ['city', 'state'] as const) {
        if (!value[field] || value[field].length < 2) {
          context.addIssue({
            code: 'custom',
            path: [field],
            message: `Add a ${field} for an in-person business.`,
          })
        }
      }
    }
    if (value.weeklyHours.length && !value.hoursTimeZone) {
      context.addIssue({
        code: 'custom',
        path: ['hoursTimeZone'],
        message: 'Choose a time zone for business hours.',
      })
    }
    if (value.hoursTimeZone) {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value.hoursTimeZone })
      } catch {
        context.addIssue({
          code: 'custom',
          path: ['hoursTimeZone'],
          message: 'Choose a valid time zone.',
        })
      }
    }
    const linkError = businessLinkError({
      ...value,
      websiteUrl: value.websiteUrl ?? '',
      appStoreUrl: value.appStoreUrl ?? '',
      playStoreUrl: value.playStoreUrl ?? '',
      socialUrl: value.socialUrl ?? '',
      contactUrl: value.contactUrl ?? '',
    })
    if (linkError) context.addIssue({ code: 'custom', path: ['websiteUrl'], message: linkError })
  })

export const businessListQuerySchema = z.object({
  q: z.string().trim().max(500).default(''),
  category: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(z.enum(businessCategoryValues)).max(businessCategoryValues.length).default([]),
    )
    .transform((values) => [...new Set(values)]),
  location: z.string().trim().max(160).default(''),
  city: z.string().trim().max(100).default(''),
  state: z.string().trim().max(100).default(''),
  operationMode: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(z.enum(operationModeValues)).max(operationModeValues.length).default([]),
    )
    .transform((values) => [...new Set(values)]),
  sort: z.enum(['relevance', 'top_rated', 'most_reviewed', 'newest']).default('relevance'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
})

export const businessSlugSchema = z.object({
  slug: z.string().trim().toLowerCase().refine(isAvailableBusinessSlugFormat, {
    message: 'Use 3–48 letters, numbers, or hyphens. Some names are reserved.',
  }),
})

export const reviewBusinessSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({ decision: z.literal('reject'), reason: cleanText(8, 500) }),
])

export type BusinessSubmissionInput = z.infer<typeof businessSubmissionSchema>
export type BusinessListQuery = z.infer<typeof businessListQuerySchema>
export type BusinessReviewInput = z.infer<typeof reviewBusinessSchema>

export function normalizedKey(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
}
