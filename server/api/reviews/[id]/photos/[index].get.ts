import { createError, getRouterParam, setResponseHeaders } from 'h3'
import { z } from 'zod'
import { MAX_REVIEW_PHOTOS } from '~~/shared/reviews'
import { loadPublicReviewPhoto } from '@server/domains/reviews/photos'

const paramsSchema = z.object({
  id: z.uuid(),
  index: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(0)
        .max(MAX_REVIEW_PHOTOS - 1),
    ),
})

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  const parsed = paramsSchema.safeParse({
    id: getRouterParam(event, 'id'),
    index: getRouterParam(event, 'index'),
  })
  if (!parsed.success) throw createError({ statusCode: 404, statusMessage: 'Photo not found.' })
  const photo = await loadPublicReviewPhoto(parsed.data.id, parsed.data.index)
  setResponseHeaders(event, { 'Content-Type': photo.contentType })
  return photo.data
})
