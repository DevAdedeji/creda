import { and, eq, inArray, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/lib/db'
import { businessImageUpload } from '~~/lib/db/schema'
import { validateMediaUrls } from '@server/domains/businesses/media'

type ReviewTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function syncReviewPhotos(
  tx: ReviewTransaction,
  authorUserId: string,
  selected: string[],
  proofs: string[],
  previous: string[] = [],
): Promise<void> {
  validateMediaUrls(authorUserId, selected, proofs, previous)
  const urls = [...new Set([...selected, ...previous])].sort()
  if (!urls.length) return

  // Coordinate attachments and removals with the cleanup worker under the same image locks.
  const images = await tx
    .select()
    .from(businessImageUpload)
    .where(inArray(businessImageUpload.url, urls))
    .orderBy(businessImageUpload.url)
    .for('update')
  for (const url of selected) {
    const image = images.find((row) => row.url === url)
    if (!image || image.ownerUserId !== authorUserId || image.status !== 'ready') {
      throw createError({
        statusCode: 400,
        statusMessage: 'A photo is no longer available. Please upload it again.',
      })
    }
  }
  if (selected.length) {
    await tx
      .update(businessImageUpload)
      .set({ deleteAfter: null })
      .where(inArray(businessImageUpload.url, selected))
  }
  const removed = previous.filter((url) => !selected.includes(url))
  if (removed.length) {
    await tx
      .update(businessImageUpload)
      .set({ deleteAfter: sql`now()` })
      .where(
        and(inArray(businessImageUpload.url, removed), eq(businessImageUpload.status, 'ready')),
      )
  }
}
