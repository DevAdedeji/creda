import { and, eq, ne, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business } from '~~/lib/db/schema'
import type { BusinessProfileDetailsResponse } from '~~/shared/business-profile'
import type { businessProfileUpdateSchema } from '~~/shared/business-profile'
import type { z } from 'zod'

export class BusinessProfileError extends Error {
  constructor(
    readonly code: 'not_found' | 'not_editable' | 'conflict',
    message: string,
  ) {
    super(message)
  }
}
export async function saveBusinessProfileDetails(
  id: string,
  ownerUserId: string,
  input: z.infer<typeof businessProfileUpdateSchema>,
): Promise<BusinessProfileDetailsResponse> {
  // One conditional write protects ownership, moderation and concurrent edits together.
  const [updated] = await db
    .update(business)
    .set({
      profileDetails: input.details,
      profileDetailsRevision: sql`${business.profileDetailsRevision} + 1`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(business.id, id),
        eq(business.ownerUserId, ownerUserId),
        ne(business.status, 'suspended'),
        eq(business.profileDetailsRevision, input.revision),
      ),
    )
    .returning({ details: business.profileDetails, revision: business.profileDetailsRevision })
  if (updated) return updated
  const [current] = await db
    .select({ status: business.status })
    .from(business)
    .where(and(eq(business.id, id), eq(business.ownerUserId, ownerUserId)))
    .limit(1)
  if (!current) throw new BusinessProfileError('not_found', 'Business not found.')
  if (current.status === 'suspended')
    throw new BusinessProfileError(
      'not_editable',
      'Changes are paused while this listing is under review.',
    )
  throw new BusinessProfileError(
    'conflict',
    'These details changed in another session. Reload the saved details before trying again.',
  )
}
