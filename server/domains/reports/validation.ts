import { z } from 'zod'
import { reportReasons } from '~~/shared/reports'

const uuid = z.uuid()
export const submitReportSchema = z
  .object({
    businessId: uuid,
    reviewId: uuid.optional(),
    reason: z.enum(reportReasons.map((item) => item.value)),
    details: z
      .string()
      .trim()
      .max(1000)
      .transform((value) => value || null),
  })
  .superRefine((value, context) => {
    if (value.reason === 'other' && (!value.details || value.details.length < 10)) {
      context.addIssue({
        code: 'custom',
        path: ['details'],
        message: 'Tell us a little more (at least 10 characters).',
      })
    }
    if (value.details && value.details.length < 10) {
      context.addIssue({
        code: 'custom',
        path: ['details'],
        message: 'Add at least 10 characters or leave the details blank.',
      })
    }
  })

export const reportDecisionSchema = z.object({
  action: z.enum(['dismiss', 'remove', 'restore']),
  reason: z.string().trim().min(8).max(500),
})

export type SubmitReportInput = z.output<typeof submitReportSchema>
export type ReportDecisionInput = z.output<typeof reportDecisionSchema>
