import { z } from 'zod'

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

export const submitReviewSchema = z.object({
  businessId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  body: normalizedText(30, 2000),
  experienceMonth,
})

export const editReviewSchema = submitReviewSchema.omit({ businessId: true })
export const replySchema = z.object({ body: normalizedText(2, 1000) })
export const moderateReviewSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('publish') }),
  z.object({ decision: z.literal('reject'), reason: normalizedText(8, 500) }),
  z.object({ decision: z.literal('remove'), reason: normalizedText(8, 500) }),
])

export type SubmitReviewInput = z.output<typeof submitReviewSchema>
export type EditReviewInput = z.output<typeof editReviewSchema>
export type ModerateReviewInput = z.output<typeof moderateReviewSchema>
