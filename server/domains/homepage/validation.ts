import { z } from 'zod'
import { HOMEPAGE_FEATURED_LIMIT } from '~~/shared/homepage'

const businessId = z.string().trim().min(1).max(128)

export const homepageSelectionSchema = z
  .object({
    heroId: businessId.nullable(),
    featuredIds: z
      .array(businessId)
      .max(HOMEPAGE_FEATURED_LIMIT)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Choose each featured business only once.',
      ),
    revision: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict()
