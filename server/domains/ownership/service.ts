import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business, ownershipDecision, ownershipRequest, user } from '~~/lib/db/schema'
import type {
  AdminVerificationItem,
  OwnerVerificationView,
  OwnershipMethod,
  OwnershipRequestView,
} from '~~/shared/ownership'
import type { OwnershipDecisionInput, OwnershipRequestInput } from './validation'

type RequestRow = typeof ownershipRequest.$inferSelect

export class OwnershipDomainError extends Error {
  constructor(
    readonly code: 'not_found' | 'conflict',
    message: string,
  ) {
    super(message)
  }
}

function toRequestView(row: RequestRow): OwnershipRequestView {
  return {
    id: row.id,
    method: row.method as OwnershipMethod,
    evidenceNote: row.evidenceNote,
    status: row.status,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  }
}

export async function getOwnerVerification(
  businessId: string,
  ownerUserId: string,
): Promise<OwnerVerificationView> {
  const [owned] = await db
    .select({
      id: business.id,
      name: business.name,
      ownershipStatus: business.ownershipStatus,
    })
    .from(business)
    .where(and(eq(business.id, businessId), eq(business.ownerUserId, ownerUserId)))
    .limit(1)
  if (!owned) throw new OwnershipDomainError('not_found', 'Business not found.')

  const [latest] = await db
    .select()
    .from(ownershipRequest)
    .where(
      and(
        eq(ownershipRequest.businessId, businessId),
        eq(ownershipRequest.requesterUserId, ownerUserId),
      ),
    )
    .orderBy(desc(ownershipRequest.createdAt), desc(ownershipRequest.id))
    .limit(1)

  return {
    businessId: owned.id,
    businessName: owned.name,
    ownershipStatus: owned.ownershipStatus,
    request: latest ? toRequestView(latest) : null,
  }
}

export async function getBusinessClaim(
  businessSlug: string,
  requesterUserId: string,
): Promise<OwnerVerificationView> {
  const [claimable] = await db
    .select({
      id: business.id,
      name: business.name,
      listingSource: business.listingSource,
      ownerUserId: business.ownerUserId,
      ownershipStatus: business.ownershipStatus,
    })
    .from(business)
    .where(and(eq(business.slug, businessSlug), eq(business.status, 'approved')))
    .limit(1)
  if (!claimable) throw new OwnershipDomainError('not_found', 'Business not found.')
  if (claimable.listingSource !== 'curated' || claimable.ownerUserId !== null) {
    if (claimable.ownerUserId === requesterUserId) {
      return getOwnerVerification(claimable.id, requesterUserId)
    }
    throw new OwnershipDomainError('conflict', 'This business has already been claimed.')
  }

  const [latest] = await db
    .select()
    .from(ownershipRequest)
    .where(
      and(
        eq(ownershipRequest.businessId, claimable.id),
        eq(ownershipRequest.requesterUserId, requesterUserId),
      ),
    )
    .orderBy(desc(ownershipRequest.createdAt), desc(ownershipRequest.id))
    .limit(1)

  return {
    businessId: claimable.id,
    businessName: claimable.name,
    ownershipStatus: claimable.ownershipStatus,
    request: latest ? toRequestView(latest) : null,
  }
}

export async function requestBusinessClaim(
  businessSlug: string,
  requesterUserId: string,
  input: OwnershipRequestInput,
): Promise<OwnerVerificationView> {
  await db.transaction(async (tx) => {
    const [claimable] = await tx
      .select({
        id: business.id,
        listingSource: business.listingSource,
        ownerUserId: business.ownerUserId,
      })
      .from(business)
      .where(and(eq(business.slug, businessSlug), eq(business.status, 'approved')))
      .limit(1)
      .for('update')
    if (!claimable) throw new OwnershipDomainError('not_found', 'Business not found.')
    if (claimable.listingSource !== 'curated' || claimable.ownerUserId !== null) {
      throw new OwnershipDomainError('conflict', 'This business has already been claimed.')
    }

    const [pending] = await tx
      .select({ id: ownershipRequest.id })
      .from(ownershipRequest)
      .where(
        and(
          eq(ownershipRequest.businessId, claimable.id),
          eq(ownershipRequest.requesterUserId, requesterUserId),
          eq(ownershipRequest.status, 'pending'),
        ),
      )
      .limit(1)
    if (pending) return

    await tx.insert(ownershipRequest).values({
      id: randomUUID(),
      businessId: claimable.id,
      requesterUserId,
      method: input.method,
      evidenceNote: input.evidenceNote,
      status: 'pending',
    })
  })

  return getBusinessClaim(businessSlug, requesterUserId)
}

export async function requestOwnershipVerification(
  businessId: string,
  ownerUserId: string,
  input: OwnershipRequestInput,
): Promise<OwnerVerificationView> {
  await db.transaction(async (tx) => {
    const [owned] = await tx
      .select({ id: business.id, ownershipStatus: business.ownershipStatus })
      .from(business)
      .where(and(eq(business.id, businessId), eq(business.ownerUserId, ownerUserId)))
      .limit(1)
      .for('update')
    if (!owned) throw new OwnershipDomainError('not_found', 'Business not found.')
    if (owned.ownershipStatus === 'verified') {
      throw new OwnershipDomainError('conflict', 'Ownership has already been verified.')
    }

    const [pending] = await tx
      .select({ id: ownershipRequest.id })
      .from(ownershipRequest)
      .where(
        and(eq(ownershipRequest.businessId, businessId), eq(ownershipRequest.status, 'pending')),
      )
      .limit(1)
    if (pending) return

    await tx.insert(ownershipRequest).values({
      id: randomUUID(),
      businessId,
      requesterUserId: ownerUserId,
      method: input.method,
      evidenceNote: input.evidenceNote,
      status: 'pending',
    })
    await tx
      .update(business)
      .set({ ownershipStatus: 'pending', updatedAt: sql`now()` })
      .where(eq(business.id, businessId))
  })

  return getOwnerVerification(businessId, ownerUserId)
}

export async function listAdminVerification(): Promise<AdminVerificationItem[]> {
  const rows = await db
    .select({
      request: ownershipRequest,
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(ownershipRequest)
    .innerJoin(business, eq(ownershipRequest.businessId, business.id))
    .innerJoin(user, eq(ownershipRequest.requesterUserId, user.id))
    .where(inArray(ownershipRequest.status, ['pending', 'approved']))
    .orderBy(
      sql`CASE WHEN ${ownershipRequest.status} = 'pending' THEN 0 ELSE 1 END`,
      asc(ownershipRequest.createdAt),
    )
    .limit(100)

  return rows.map((row) => ({
    ...toRequestView(row.request),
    businessId: row.businessId,
    businessName: row.businessName,
    businessSlug: row.businessSlug,
    ownerName: row.ownerName,
    ownerEmail: row.ownerEmail,
  }))
}

export async function decideOwnershipVerification(
  requestId: string,
  actorUserId: string,
  input: OwnershipDecisionInput,
): Promise<{ id: string; status: RequestRow['status'] }> {
  return db.transaction(async (tx) => {
    const [lookup] = await tx
      .select({ businessId: ownershipRequest.businessId })
      .from(ownershipRequest)
      .where(eq(ownershipRequest.id, requestId))
      .limit(1)
    if (!lookup) throw new OwnershipDomainError('not_found', 'Verification request not found.')

    // Lock the business first, matching the owner-request lock order.
    const [owned] = await tx
      .select({
        id: business.id,
        listingSource: business.listingSource,
        ownerUserId: business.ownerUserId,
        ownershipStatus: business.ownershipStatus,
      })
      .from(business)
      .where(eq(business.id, lookup.businessId))
      .limit(1)
      .for('update')
    if (!owned) throw new OwnershipDomainError('not_found', 'Business not found.')

    const [request] = await tx
      .select()
      .from(ownershipRequest)
      .where(eq(ownershipRequest.id, requestId))
      .limit(1)
      .for('update')
    if (!request) throw new OwnershipDomainError('not_found', 'Verification request not found.')

    const nextStatus =
      input.decision === 'approve'
        ? 'approved'
        : input.decision === 'decline'
          ? 'declined'
          : 'revoked'
    if (request.status === nextStatus) return { id: request.id, status: request.status }
    const expectedStatus = input.decision === 'revoke' ? 'approved' : 'pending'
    if (request.status !== expectedStatus) {
      throw new OwnershipDomainError('conflict', 'This verification request has already changed.')
    }
    const curatedClaim = owned.listingSource === 'curated' && owned.ownerUserId === null
    const pendingStateChanged =
      expectedStatus === 'pending' &&
      (curatedClaim
        ? owned.ownershipStatus !== 'unverified'
        : owned.ownershipStatus !== 'pending' || owned.ownerUserId !== request.requesterUserId)
    if (
      pendingStateChanged ||
      (expectedStatus === 'approved' && owned.ownershipStatus !== 'verified')
    ) {
      throw new OwnershipDomainError('conflict', 'The business verification state has changed.')
    }

    const reason = input.reason || null
    await tx
      .update(ownershipRequest)
      .set({
        status: nextStatus,
        reviewNote: reason,
        reviewedByUserId: actorUserId,
        reviewedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(ownershipRequest.id, requestId))
    if (nextStatus === 'approved' && curatedClaim) {
      const competingClaims = await tx
        .select({ id: ownershipRequest.id })
        .from(ownershipRequest)
        .where(
          and(
            eq(ownershipRequest.businessId, request.businessId),
            eq(ownershipRequest.status, 'pending'),
            ne(ownershipRequest.id, request.id),
          ),
        )
        .for('update')
      if (competingClaims.length) {
        const competingIds = competingClaims.map((claim) => claim.id)
        const competingReason = 'Another ownership claim was approved.'
        await tx
          .update(ownershipRequest)
          .set({
            status: 'declined',
            reviewNote: competingReason,
            reviewedByUserId: actorUserId,
            reviewedAt: sql`now()`,
            updatedAt: sql`now()`,
          })
          .where(inArray(ownershipRequest.id, competingIds))
        await tx.insert(ownershipDecision).values(
          competingIds.map((competingRequestId) => ({
            id: randomUUID(),
            requestId: competingRequestId,
            businessId: request.businessId,
            actorUserId,
            fromStatus: 'pending' as const,
            toStatus: 'declined' as const,
            reason: competingReason,
          })),
        )
      }
      await tx
        .update(business)
        .set({
          listingSource: 'member',
          ownerUserId: request.requesterUserId,
          ownershipStatus: 'verified',
          updatedAt: sql`now()`,
        })
        .where(eq(business.id, request.businessId))
    } else {
      await tx
        .update(business)
        .set({
          ownershipStatus:
            nextStatus === 'approved'
              ? 'verified'
              : nextStatus === 'declined'
                ? 'unverified'
                : 'revoked',
          updatedAt: sql`now()`,
        })
        .where(eq(business.id, request.businessId))
    }
    await tx.insert(ownershipDecision).values({
      id: randomUUID(),
      requestId,
      businessId: request.businessId,
      actorUserId,
      fromStatus: request.status,
      toStatus: nextStatus,
      reason,
    })
    return { id: request.id, status: nextStatus }
  })
}
