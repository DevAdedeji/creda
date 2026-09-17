import { z } from 'zod'

export const ownershipRequestSchema = z.strictObject({
  method: z.enum(['official_email', 'official_website', 'official_social', 'other']),
  evidenceNote: z
    .string()
    .trim()
    .min(20, 'Explain how we can confirm your connection to this business.')
    .max(2000, 'Keep the verification details under 2,000 characters.'),
})

export const ownershipDecisionSchema = z
  .strictObject({
    decision: z.enum(['approve', 'decline', 'revoke']),
    reason: z.string().trim().max(500, 'Keep the reason under 500 characters.').optional(),
  })
  .refine((value) => value.decision === 'approve' || (value.reason?.length ?? 0) >= 10, {
    message: 'Add a reason of at least 10 characters.',
    path: ['reason'],
  })

export type OwnershipRequestInput = z.output<typeof ownershipRequestSchema>
export type OwnershipDecisionInput = z.output<typeof ownershipDecisionSchema>
