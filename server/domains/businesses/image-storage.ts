import { randomUUID } from 'node:crypto'
import { and, eq, inArray, lte, or, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/lib/db'
import { business, businessImageUpload, businessReview, user } from '~~/lib/db/schema'

const DAILY_UPLOAD_LIMIT = 30
const DAY_MS = 24 * 60 * 60 * 1000
const RETRY_MS = 15 * 60 * 1000

function mediaReference(url: string) {
  return or(
    eq(business.logoUrl, url),
    eq(business.coverUrl, url),
    sql`${url} = ANY(${business.galleryUrls})`,
  )!
}

export async function reserveBusinessImageUpload(ownerUserId: string, path: string) {
  return db.transaction(async (tx) => {
    // The user row serializes concurrent reservations for this account.
    const [owner] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, ownerUserId))
      .for('update')
    if (!owner) throw createError({ statusCode: 401, statusMessage: 'Sign in to upload images.' })
    const [usage] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(businessImageUpload)
      .where(
        and(
          eq(businessImageUpload.ownerUserId, ownerUserId),
          sql`${businessImageUpload.createdAt} >= now() - interval '24 hours'`,
        ),
      )
    if ((usage?.total ?? 0) >= DAILY_UPLOAD_LIMIT) {
      throw createError({
        statusCode: 429,
        statusMessage: 'You can upload up to 30 images in 24 hours. Please try again later.',
      })
    }
    await tx.insert(businessImageUpload).values({ id: randomUUID(), ownerUserId, path })
  })
}

export async function finishBusinessImageUpload(path: string, url: string) {
  await db
    .update(businessImageUpload)
    .set({ url, status: 'ready', deleteAfter: new Date(Date.now() + DAY_MS) })
    .where(eq(businessImageUpload.path, path))
}

export async function failBusinessImageUpload(path: string) {
  await db
    .update(businessImageUpload)
    .set({ status: 'deleting', deleteAfter: new Date() })
    .where(eq(businessImageUpload.path, path))
}

async function deleteImage(urlOrPath: { url?: string; path?: string }) {
  const claimed = await db.transaction(async (tx) => {
    const [image] = await tx
      .select()
      .from(businessImageUpload)
      .where(
        urlOrPath.url
          ? eq(businessImageUpload.url, urlOrPath.url)
          : eq(businessImageUpload.path, urlOrPath.path!),
      )
      .for('update')
    if (!image || image.status === 'deleted') return null
    if (image.url) {
      const [reference] = await tx
        .select({ id: business.id })
        .from(business)
        .where(mediaReference(image.url))
        .limit(1)
      const [reviewReference] = await tx
        .select({ id: businessReview.id })
        .from(businessReview)
        .where(sql`${image.url} = ANY(${businessReview.photoUrls})`)
        .limit(1)
      // Moderated reviews retain their photos so an administrator can review or restore them.
      if (reference || reviewReference) {
        await tx
          .update(businessImageUpload)
          .set({ status: 'ready', deleteAfter: null })
          .where(eq(businessImageUpload.id, image.id))
        return null
      }
    }
    if (image.status === 'deleting' && image.deleteAfter && image.deleteAfter > new Date()) {
      return null
    }
    await tx
      .update(businessImageUpload)
      .set({ status: 'deleting', deleteAfter: new Date(Date.now() + RETRY_MS) })
      .where(eq(businessImageUpload.id, image.id))
    return { id: image.id, path: image.path }
  })
  if (!claimed) return

  const key = process.env.CREDA_BYTESHIP_API_KEY
  if (!key) {
    console.error('Business image cleanup requires CREDA_BYTESHIP_API_KEY.')
    return
  }
  try {
    const response = await fetch(`https://api.byteship.dev/v1/files/${claimed.path}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok && response.status !== 404) {
      throw new Error(`Byteship delete returned ${response.status}`)
    }
    await db
      .update(businessImageUpload)
      .set({ status: 'deleted', deletedAt: new Date(), deleteAfter: null })
      .where(eq(businessImageUpload.id, claimed.id))
  } catch (error) {
    console.error('Business image cleanup failed:', error instanceof Error ? error.message : error)
  }
}

export async function deleteUnusedBusinessImages(urls: string[]) {
  for (const url of new Set(urls)) await deleteImage({ url })
}

export async function cleanupBusinessImages() {
  const due = await db
    .select({ path: businessImageUpload.path })
    .from(businessImageUpload)
    .where(
      and(
        inArray(businessImageUpload.status, ['ready', 'deleting']),
        lte(businessImageUpload.deleteAfter, new Date()),
      ),
    )
    .limit(100)
  for (const image of due) await deleteImage({ path: image.path })
  return due.length
}
