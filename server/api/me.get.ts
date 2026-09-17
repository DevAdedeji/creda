import { auth } from '~~/lib/auth'
import { isAdminEmail } from '../utils/access'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      emailVerified: session.user.emailVerified,
      isAdmin: session.user.emailVerified && isAdminEmail(session.user.email),
    },
  }
})
