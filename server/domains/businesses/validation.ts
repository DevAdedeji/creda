import { z } from 'zod'
import {
  businessCategoryValues,
  businessLinkError,
  businessTypeValues,
  operationModeValues,
} from '~~/shared/businesses'

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
    businessTypes: z
      .array(z.enum(businessTypeValues))
      .min(1)
      .max(businessTypeValues.length)
      .refine(
        (types) => new Set(types).size === types.length,
        'Choose each business type only once.',
      ),
    operationMode: z.enum(operationModeValues),
    location: z
      .string()
      .trim()
      .max(160)
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
    contactUrl: destinationUrl,
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
  q: z.string().trim().max(80).default(''),
  category: z.enum(businessCategoryValues).optional(),
  businessType: z.enum(businessTypeValues).optional(),
  location: z.string().trim().max(160).default(''),
  sort: z.enum(['relevance', 'top_rated', 'most_reviewed', 'newest']).default('relevance'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
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
