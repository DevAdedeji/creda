import { z } from 'zod'
import { MAX_REVIEW_PHOTOS } from '~~/shared/reviews'

const normalizedText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, ' '))
    .pipe(z.string().min(min).max(max))

const experienceMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Choose the month of your experience.')
  .refine((value) => value <= new Date().toISOString().slice(0, 7), 'Choose a past month.')

const photoUrls = z
  .array(
    z
      .url()
      .max(1000)
      .refine((value) => {
        try {
          const url = new URL(value)
          return (
            url.protocol === 'https:' &&
            url.hostname === 'cdn.byteship.cloud' &&
            !url.username &&
            !url.password
          )
        } catch {
          return false
        }
      }, 'Upload your photos using the photo picker.'),
  )
  .max(MAX_REVIEW_PHOTOS, `Add up to ${MAX_REVIEW_PHOTOS} photos to your review.`)
  .refine((urls) => new Set(urls).size === urls.length, 'Choose each photo only once.')

export const submitReviewSchema = z.object({
  businessId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  body: normalizedText(30, 2000),
  experienceMonth,
  photoUrls: photoUrls.default([]),
  mediaProofs: z.array(z.string().max(2000)).max(MAX_REVIEW_PHOTOS).default([]),
})

export const editReviewSchema = submitReviewSchema.omit({ businessId: true }).extend({
  photoUrls: photoUrls.optional(),
})
export const replySchema = z.object({ body: normalizedText(2, 1000) })
export const moderateReviewSchema = z.object({
  decision: z.literal('remove'),
  reason: normalizedText(8, 500),
})

export type SubmitReviewInput = z.output<typeof submitReviewSchema>
export type EditReviewInput = z.output<typeof editReviewSchema>
export type ModerateReviewInput = z.output<typeof moderateReviewSchema>
