import { z } from 'zod'

// Curated entries deliberately allow less than owner-authored profiles: no prices
// or inferred negative amenities. The full application schema is checked in tests.
export const curatedBusinessProfileSchema = z.strictObject({
  sourceUrl: z.url().refine((value) => {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
  }, 'Use an official HTTPS source.'),
  reviewedAt: z.iso.date(),
  details: z.strictObject({
    offerings: z
      .array(
        z.strictObject({
          name: z.string().trim().min(2).max(80),
          kind: z.enum(['service', 'product']),
          description: z.string().trim().min(2).max(300),
          price: z.strictObject({ type: z.literal('unspecified') }),
        }),
      )
      .min(1)
      .max(8),
    practical: z.partialRecord(
      z.enum([
        'delivery',
        'pickup',
        'appointments',
        'onlineConsultations',
        'cards',
        'freeTrial',
        'freePlan',
        'subscription',
      ]),
      z.enum(['yes', 'no']),
    ),
    faqs: z
      .array(
        z.strictObject({
          question: z.string().trim().min(5).max(160),
          answer: z.string().trim().min(2).max(600),
        }),
      )
      .max(8),
  }),
})

export async function fillEmptyCuratedProfiles(sql, profiles) {
  if (!profiles.length) return []
  // Fill once. Nonempty details (including manual imports) and explicitly cleared
  // owner edits are preserved. Recheck ownership in SQL to protect claim races.
  return sql`
    UPDATE business AS b
    SET profile_details = seed.details, profile_details_source = seed.source, updated_at = NOW()
    FROM jsonb_to_recordset(${sql.json(profiles)}) AS seed(slug text, details jsonb, source jsonb)
    WHERE b.slug = seed.slug
      AND b.listing_source = 'curated'
      AND b.owner_user_id IS NULL
      AND b.ownership_status = 'unverified'
      AND b.profile_details_revision = 0
      AND b.profile_details = '{"offerings":[],"practical":{},"faqs":[]}'::jsonb
      AND b.profile_details IS DISTINCT FROM seed.details
    RETURNING b.slug
  `
}
