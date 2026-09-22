import { randomUUID } from 'node:crypto'
import { db } from '~~/lib/db'
import { emailOutbox } from '~~/lib/db/schema'
import { prepareEmail } from '~~/lib/email/send'
import type { AccountEmail } from '~~/lib/email/message'

export type NotificationTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
export interface QueuedEmail {
  dedupeKey: string
  message: AccountEmail
}

export async function enqueueEmails(
  tx: NotificationTransaction,
  emails: QueuedEmail[],
): Promise<void> {
  if (!emails.length) return
  await tx
    .insert(emailOutbox)
    .values(
      emails.map(({ dedupeKey, message }) => ({
        id: randomUUID(),
        dedupeKey,
        payload: prepareEmail(message),
      })),
    )
    .onConflictDoNothing({ target: emailOutbox.dedupeKey })
}
