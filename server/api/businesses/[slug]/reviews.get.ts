import { createError, getQuery, getRouterParam, setResponseHeader } from 'h3'
import { z } from 'zod'
import { auth } from '~~/lib/auth'
import { listReviews } from '@server/domains/reviews/service'
import { rethrowReviewError } from '@server/domains/reviews/http-error'

const pageSchema = z.coerce.number().int().min(1).max(10000).default(1)

export default defineEventHandler(async (event) => {
  // This response includes the signed-in user's own review and permissions.
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Business not found.' })
  }
  const parsed = pageSchema.safeParse(getQuery(event).page)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid page.' })
  const session = await auth.api.getSession({ headers: event.headers })
  try {
    return await listReviews(
      slug,
      parsed.data,
      session?.user?.emailVerified ? session.user.id : undefined,
    )
  } catch (error) {
    rethrowReviewError(error)
  }
})
