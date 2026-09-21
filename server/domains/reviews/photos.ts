import { and, eq } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '~~/lib/db'
import { business, businessReview } from '~~/lib/db/schema'
import { MAX_REVIEW_PHOTO_BYTES } from '~~/shared/reviews'

export async function loadPublicReviewPhoto(
  reviewId: string,
  index: number,
): Promise<{ data: Buffer; contentType: string }> {
  const [review] = await db
    .select({ photoUrls: businessReview.photoUrls })
    .from(businessReview)
    .innerJoin(business, eq(business.id, businessReview.businessId))
    .where(
      and(
        eq(businessReview.id, reviewId),
        eq(businessReview.status, 'published'),
        eq(business.status, 'approved'),
      ),
    )
    .limit(1)
  const source = review?.photoUrls[index]
  if (!source) throw createError({ statusCode: 404, statusMessage: 'Photo not found.' })

  // Serve the bytes, not a redirect: legacy storage URLs contain the uploader's account ID.
  try {
    const url = new URL(source)
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'cdn.byteship.cloud' ||
      url.username ||
      url.password ||
      url.port
    ) {
      throw new Error('Invalid photo source')
    }
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) })
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
    if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
      throw new Error('Photo unavailable')
    }
    if (Number(response.headers.get('content-length')) > MAX_REVIEW_PHOTO_BYTES) {
      throw new Error('Photo too large')
    }
    const data = Buffer.from(await response.arrayBuffer())
    if (!data.length || data.length > MAX_REVIEW_PHOTO_BYTES) throw new Error('Invalid photo size')
    return { data, contentType }
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'This photo could not be loaded. Please try again.',
    })
  }
}
