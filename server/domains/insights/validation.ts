import { z } from 'zod'
import { insightDestinationKeys } from '~~/shared/insights'

const base = z.object({
  businessId: z.string().min(1).max(128),
  surface: z.enum(['profile', 'bio']),
})
export const insightEventSchema = z.discriminatedUnion('action', [
  base.extend({ action: z.literal('view') }).strict(),
  base.extend({ action: z.literal('click'), destination: z.enum(insightDestinationKeys) }).strict(),
])
export const insightQuerySchema = z.object({ days: z.enum(['7', '30']).default('7') })
export const insightBusinessIdSchema = z.string().min(1).max(128)
