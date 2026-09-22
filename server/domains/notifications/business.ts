import { createHash } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { business, user } from '~~/lib/db/schema'
import { getAdminEmails } from '@server/config/admin'
import { enqueueEmails, type NotificationTransaction, type QueuedEmail } from './queue'
import { logEmailEvent } from './telemetry'

type BusinessNotice = Pick<typeof business.$inferSelect, 'id' | 'name' | 'slug' | 'ownerUserId'>
export interface OwnershipNotice {
  eventId: string
  requesterUserId: string
  status: 'approved' | 'declined' | 'revoked'
  reason: string | null
}

function link(path: string): string {
  const origin = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:4002')
  if (!['http:', 'https:'].includes(origin.protocol))
    throw new Error('Invalid business notification origin')
  return new URL(path, origin.origin).toString()
}

function subjectName(name: string): string {
  return name.replace(/[\r\n]+/g, ' ')
}

export async function queueBusinessCreated(
  tx: NotificationTransaction,
  listing: BusinessNotice,
): Promise<void> {
  if (!listing.ownerUserId) return
  const [owner] = await tx
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, listing.ownerUserId))
  if (!owner) return
  const profile = link(`/businesses/${listing.slug}`)
  const messages: QueuedEmail[] = [
    {
      dedupeKey: `business-created:${listing.id}:owner`,
      message: {
        to: owner.email,
        subject: `${subjectName(listing.name)} is live on Creda`,
        heading: 'Your business is live',
        body: `${listing.name} is now published on Creda. People can discover your business, find your official links, and share their experiences.\n\nYour business profile: ${profile}\nYour bio link: ${link(`/${listing.slug}`)}`,
        action: { label: 'View your business', url: profile },
        footer:
          'You can update your details and photos from Your businesses in your Creda account.',
      },
    },
  ]
  const admins = getAdminEmails()
  if (!admins.length)
    logEmailEvent({
      operation: 'enqueue',
      outcome: 'failure',
      code: 'admin_email_recipients_missing',
    })
  for (const recipient of admins) {
    if (!z.email().safeParse(recipient).success) {
      logEmailEvent({
        operation: 'enqueue',
        outcome: 'failure',
        code: 'admin_email_recipient_invalid',
      })
      continue
    }
    messages.push({
      dedupeKey: `business-created:${listing.id}:admin:${createHash('sha256').update(recipient).digest('hex')}`,
      message: {
        to: recipient,
        subject: `New business on Creda: ${subjectName(listing.name)}`,
        heading: 'A new business has joined Creda',
        body: `${listing.name} was listed by ${owner.name} (${owner.email}). The profile is already live.\n\n${profile}`,
        action: { label: 'View business', url: profile },
        footer: 'You received this notification because you are a Creda administrator.',
      },
    })
  }
  await enqueueEmails(tx, messages)
}

export async function queueBusinessDecision(
  tx: NotificationTransaction,
  listing: BusinessNotice,
  input: {
    eventId: string
    status: 'approved' | 'rejected' | 'suspended' | 'restored'
    reason: string | null
  },
): Promise<void> {
  if (!listing.ownerUserId) return
  const [owner] = await tx
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, listing.ownerUserId))
  if (!owner) return
  const live = input.status === 'approved' || input.status === 'restored'
  const heading = live
    ? 'Your business is live'
    : input.status === 'rejected'
      ? 'Your business listing was not approved'
      : 'Your business listing has been removed'
  const body = live
    ? `${listing.name} is now visible on Creda.${input.reason ? `\n\nUpdate: ${input.reason}` : ''}`
    : `${listing.name} is not currently visible in the public directory.\n\nReason: ${input.reason}\n\n${input.status === 'rejected' ? 'Review the reason and update your listing from your account.' : 'You can view your listing and its status in your account.'}`
  await enqueueEmails(tx, [
    {
      dedupeKey: `business-decision:${input.eventId}:owner`,
      message: {
        to: owner.email,
        subject: `${subjectName(listing.name)} — ${heading.toLowerCase()}`,
        heading,
        body,
        action: {
          label: live ? 'View your business' : 'Go to your businesses',
          url: link(live ? `/businesses/${listing.slug}` : '/dashboard/businesses'),
        },
        footer:
          'This update concerns your business listing. Ownership verification is handled separately.',
      },
    },
  ])
}

export async function queueOwnershipDecisions(
  tx: NotificationTransaction,
  listing: Pick<BusinessNotice, 'id' | 'name' | 'slug'>,
  decisions: OwnershipNotice[],
): Promise<void> {
  if (!decisions.length) return
  const recipients = await tx
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, [...new Set(decisions.map((item) => item.requesterUserId))]))
  const emails = new Map(recipients.map((recipient) => [recipient.id, recipient.email]))
  const messages: QueuedEmail[] = []
  for (const decision of decisions) {
    const to = emails.get(decision.requesterUserId)
    if (!to) continue
    const approved = decision.status === 'approved'
    const heading = approved
      ? 'Your business ownership is verified'
      : decision.status === 'declined'
        ? 'An update on your ownership request'
        : 'Your ownership verification has been removed'
    const body = approved
      ? `Your ownership of ${listing.name} has been verified. You can manage its profile from your Creda account. Ownership verification confirms who manages the profile; it is not an endorsement of the business.`
      : `${decision.status === 'declined' ? `Your request to verify ownership of ${listing.name} was not approved.` : `Ownership verification for ${listing.name} has been removed.`}\n\nReason: ${decision.reason}`
    messages.push({
      dedupeKey: `ownership-decision:${decision.eventId}:requester`,
      message: {
        to,
        subject: `${subjectName(listing.name)} — ownership ${decision.status === 'approved' ? 'verified' : decision.status === 'declined' ? 'request update' : 'verification update'}`,
        heading,
        body,
        action: {
          label: approved ? 'Manage your business' : 'View business',
          url: link(approved ? '/dashboard/businesses' : `/businesses/${listing.slug}`),
        },
        footer: 'This email is about an ownership request made through your Creda account.',
      },
    })
  }
  await enqueueEmails(tx, messages)
}
