import { randomUUID } from 'node:crypto'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import {
  business,
  businessModeration,
  businessReview,
  contentReport,
  reportDecision,
  reviewModeration,
  user,
} from '~~/lib/db/schema'
import type { AdminReportList, ReportStatus } from '~~/shared/reports'
import type { ReportDecisionInput, SubmitReportInput } from './validation'

export class ReportDomainError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export async function submitReport(reporterUserId: string, input: SubmitReportInput) {
  return db.transaction(async (tx) => {
    const [reporter] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, reporterUserId))
      .for('update')
    if (!reporter) throw new ReportDomainError(401, 'Sign in to report content.')
    const [daily] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(contentReport)
      .where(
        and(
          eq(contentReport.reporterUserId, reporterUserId),
          gte(contentReport.createdAt, sql`now() - interval '24 hours'`),
        ),
      )
    if ((daily?.count ?? 0) >= 5)
      throw new ReportDomainError(429, 'You can send up to 5 reports in 24 hours.')
    const [listing] = await tx
      .select({ id: business.id })
      .from(business)
      .where(and(eq(business.id, input.businessId), eq(business.status, 'approved')))
      .limit(1)
    if (!listing) throw new ReportDomainError(404, 'Business not found.')
    if (input.reviewId) {
      const [review] = await tx
        .select({ id: businessReview.id })
        .from(businessReview)
        .where(
          and(
            eq(businessReview.id, input.reviewId),
            eq(businessReview.businessId, input.businessId),
            eq(businessReview.status, 'published'),
          ),
        )
        .limit(1)
      if (!review) throw new ReportDomainError(404, 'Review not found.')
    }
    const [created] = await tx
      .insert(contentReport)
      .values({
        id: randomUUID(),
        reporterUserId,
        businessId: input.businessId,
        reviewId: input.reviewId ?? null,
        reason: input.reason,
        details: input.details,
      })
      .onConflictDoNothing()
      .returning({ id: contentReport.id })
    if (!created)
      throw new ReportDomainError(
        409,
        'You have already reported this content. Thank you for letting us know.',
      )
    return { id: created.id }
  })
}

export async function listAdminReports(
  page: number,
  status: ReportStatus,
): Promise<AdminReportList> {
  const where = eq(contentReport.status, status)
  const [countRows, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contentReport)
      .where(where),
    db
      .select({
        id: contentReport.id,
        businessId: contentReport.businessId,
        businessName: business.name,
        businessDescription: business.description,
        businessStatus: business.status,
        businessSlug: business.slug,
        reviewId: contentReport.reviewId,
        reviewBody: businessReview.body,
        reviewPhotoUrls: businessReview.photoUrls,
        reporterName: user.name,
        reason: contentReport.reason,
        details: contentReport.details,
        status: contentReport.status,
        decisionReason: contentReport.decisionReason,
        createdAt: contentReport.createdAt,
        reviewedAt: contentReport.reviewedAt,
      })
      .from(contentReport)
      .innerJoin(business, eq(business.id, contentReport.businessId))
      .innerJoin(user, eq(user.id, contentReport.reporterUserId))
      .leftJoin(businessReview, eq(businessReview.id, contentReport.reviewId))
      .where(where)
      .orderBy(desc(contentReport.createdAt), desc(contentReport.id))
      .limit(20)
      .offset((page - 1) * 20),
  ])
  return {
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    })),
    page,
    totalPages: Math.max(1, Math.ceil((countRows[0]?.count ?? 0) / 20)),
  }
}

export async function decideReport(id: string, actorUserId: string, input: ReportDecisionInput) {
  await db.transaction(async (tx) => {
    const [report] = await tx
      .select()
      .from(contentReport)
      .where(eq(contentReport.id, id))
      .for('update')
    if (!report) throw new ReportDomainError(404, 'Report not found.')
    if (input.action === 'restore' ? report.status !== 'actioned' : report.status !== 'open') {
      throw new ReportDomainError(409, 'This report has already been handled. Refresh the queue.')
    }
    if (input.action !== 'dismiss') {
      if (report.reviewId) {
        const [review] = await tx
          .select()
          .from(businessReview)
          .where(eq(businessReview.id, report.reviewId))
          .for('update')
        const expected = input.action === 'remove' ? 'published' : 'removed'
        if (!review || review.status !== expected)
          throw new ReportDomainError(409, 'The review has changed. Refresh the queue.')
        const next = input.action === 'remove' ? 'removed' : 'published'
        await tx
          .update(businessReview)
          .set({ status: next, updatedAt: sql`now()` })
          .where(eq(businessReview.id, review.id))
        await tx.insert(reviewModeration).values({
          id: randomUUID(),
          reviewId: review.id,
          actorUserId,
          fromStatus: review.status,
          toStatus: next,
          reason: input.reason,
        })
      } else {
        const [listing] = await tx
          .select()
          .from(business)
          .where(eq(business.id, report.businessId))
          .for('update')
        const expected = input.action === 'remove' ? 'approved' : 'suspended'
        if (!listing || listing.status !== expected)
          throw new ReportDomainError(409, 'The business has changed. Refresh the queue.')
        const next = input.action === 'remove' ? 'suspended' : 'approved'
        await tx
          .update(business)
          .set({
            status: next,
            rejectionReason: input.action === 'remove' ? input.reason : null,
            updatedAt: sql`now()`,
          })
          .where(eq(business.id, listing.id))
        await tx.insert(businessModeration).values({
          id: randomUUID(),
          businessId: listing.id,
          actorUserId,
          fromStatus: listing.status,
          toStatus: next,
          reason: input.reason,
        })
      }
    }
    const nextStatus =
      input.action === 'dismiss' ? 'dismissed' : input.action === 'remove' ? 'actioned' : 'restored'
    await tx
      .update(contentReport)
      .set({
        status: nextStatus,
        decisionReason: input.reason,
        reviewedByUserId: actorUserId,
        reviewedAt: sql`now()`,
      })
      .where(eq(contentReport.id, id))
    await tx.insert(reportDecision).values({
      id: randomUUID(),
      reportId: id,
      actorUserId,
      action: input.action,
      reason: input.reason,
    })
  })
}
