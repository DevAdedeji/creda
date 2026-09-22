import { randomUUID } from 'node:crypto'
import { setTimeout as pause } from 'node:timers/promises'
import { and, asc, eq, inArray, lt, lte, or, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { emailOutbox } from '~~/lib/db/schema'
import { deliverEmail, EmailDeliveryError } from '~~/lib/email/send'
import { emailDeliverySchema } from '~~/lib/email/message'
import { logEmailEvent } from './telemetry'

const MAX_ATTEMPTS = 8
const BATCH_SIZE = 5

async function claimEmails() {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        job: emailOutbox,
        // Resend retains idempotency keys for 24 hours. Do not retry ambiguous sends beyond that window.
        retryExpired: sql<boolean>`coalesce(${emailOutbox.firstAttemptAt} < now() - interval '23 hours', false)`,
      })
      .from(emailOutbox)
      .where(
        or(
          and(eq(emailOutbox.status, 'pending'), lte(emailOutbox.availableAt, sql`now()`)),
          and(
            eq(emailOutbox.status, 'sending'),
            lt(emailOutbox.lockedAt, sql`now() - interval '5 minutes'`),
          ),
        ),
      )
      .orderBy(asc(emailOutbox.availableAt), asc(emailOutbox.id))
      .limit(BATCH_SIZE)
      .for('update', { skipLocked: true })
    const expired = rows.filter(
      ({ job, retryExpired }) => job.attempts >= MAX_ATTEMPTS || retryExpired,
    )
    if (expired.length) {
      await tx
        .update(emailOutbox)
        .set({
          status: 'failed',
          completedAt: sql`now()`,
          lockedAt: null,
          lockToken: null,
          lastError: sql`case when ${emailOutbox.firstAttemptAt} < now() - interval '23 hours' then 'email_retry_window_expired' else 'email_attempts_exhausted' end`,
          updatedAt: sql`now()`,
        })
        .where(
          inArray(
            emailOutbox.id,
            expired.map(({ job }) => job.id),
          ),
        )
    }
    const ready = rows.filter(
      ({ job, retryExpired }) => job.attempts < MAX_ATTEMPTS && !retryExpired,
    )
    const jobs = ready.length
      ? await tx
          .update(emailOutbox)
          .set({
            status: 'sending',
            attempts: sql`${emailOutbox.attempts} + 1`,
            lockedAt: sql`now()`,
            lockToken: randomUUID(),
            firstAttemptAt: sql`coalesce(${emailOutbox.firstAttemptAt}, now())`,
            updatedAt: sql`now()`,
          })
          .where(
            inArray(
              emailOutbox.id,
              ready.map(({ job }) => job.id),
            ),
          )
          .returning()
      : []
    return { jobs, expired }
  })
}

export async function processEmailOutbox(): Promise<number> {
  const { jobs, expired } = await claimEmails()
  for (const { job, retryExpired } of expired)
    logEmailEvent({
      operation: 'deliver',
      outcome: 'failure',
      jobId: job.id,
      attempt: job.attempts,
      terminal: true,
      code: retryExpired ? 'email_retry_window_expired' : 'email_attempts_exhausted',
    })
  for (const [index, job] of jobs.entries()) {
    // Pace the small batch; provider throttling still goes through the persisted retry schedule.
    if (index > 0) await pause(600)
    const ownedLock = and(
      eq(emailOutbox.id, job.id),
      eq(emailOutbox.status, 'sending'),
      eq(emailOutbox.lockToken, job.lockToken!),
    )
    let providerId: string | null
    try {
      const payload = emailDeliverySchema.safeParse(job.payload)
      if (!payload.success) throw new EmailDeliveryError('email_payload_invalid', true)
      providerId = await deliverEmail(payload.data, `creda-notification/${job.id}`)
    } catch (error) {
      const failure =
        error instanceof EmailDeliveryError
          ? error
          : new EmailDeliveryError('email_delivery_unavailable')
      const terminal = failure.permanent || job.attempts >= MAX_ATTEMPTS
      const delay = Math.max(
        failure.retryAfterSeconds,
        Math.min(3600, 60 * 2 ** (job.attempts - 1)),
      )
      const updated = await db
        .update(emailOutbox)
        .set({
          status: terminal ? 'failed' : 'pending',
          availableAt: sql`now() + (${delay} * interval '1 second')`,
          lockedAt: null,
          lockToken: null,
          lastError: failure.code,
          completedAt: terminal ? sql`now()` : null,
          updatedAt: sql`now()`,
        })
        .where(ownedLock)
        .returning({ id: emailOutbox.id })
      if (!updated.length) {
        logEmailEvent({
          operation: 'deliver',
          outcome: 'failure',
          jobId: job.id,
          code: 'email_lease_lost',
        })
        continue
      }
      logEmailEvent({
        operation: 'deliver',
        outcome: 'failure',
        jobId: job.id,
        attempt: job.attempts,
        code: failure.code,
        terminal,
      })
      continue
    }
    // If this acknowledgement fails, the lease expires and the same provider key is retried.
    const acknowledged = await db
      .update(emailOutbox)
      .set({
        status: 'sent',
        providerId,
        completedAt: sql`now()`,
        lockedAt: null,
        lockToken: null,
        lastError: null,
        updatedAt: sql`now()`,
      })
      .where(ownedLock)
      .returning({ id: emailOutbox.id })
    if (acknowledged.length)
      logEmailEvent({
        operation: 'deliver',
        outcome: 'success',
        jobId: job.id,
        attempt: job.attempts,
      })
    else
      logEmailEvent({
        operation: 'deliver',
        outcome: 'failure',
        jobId: job.id,
        code: 'email_lease_lost',
      })
  }
  return jobs.length + expired.length
}

export async function cleanupEmailOutbox(): Promise<number> {
  const expired = db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      or(
        and(
          eq(emailOutbox.status, 'sent'),
          lt(emailOutbox.completedAt, sql`now() - interval '7 days'`),
        ),
        and(
          eq(emailOutbox.status, 'failed'),
          lt(emailOutbox.completedAt, sql`now() - interval '30 days'`),
        ),
      ),
    )
    .orderBy(asc(emailOutbox.completedAt))
    .limit(500)
  const deleted = await db
    .delete(emailOutbox)
    .where(inArray(emailOutbox.id, expired))
    .returning({ id: emailOutbox.id })
  return deleted.length
}
