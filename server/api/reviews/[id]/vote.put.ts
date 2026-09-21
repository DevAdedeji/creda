import { createError, getRouterParam, setResponseHeader } from 'h3'
import { z } from 'zod'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { readValidatedJson } from '@server/utils/validated-json'
import { reviewVoteSchema } from '@server/domains/reviews/validation'
import { setReviewVote } from '@server/domains/reviews/votes'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const id = z.uuid().safeParse(getRouterParam(event, 'id'))
  if (!id.success) throw createError({ statusCode: 404, statusMessage: 'Review not found.' })
  const { vote } = await readValidatedJson(event, reviewVoteSchema)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return setReviewVote(id.data, user.id, vote)
})
