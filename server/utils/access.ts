import { createError, getHeader, type H3Event } from 'h3'
import { auth } from '~~/lib/auth'

export function isAdminEmail(email: string): boolean {
  const allowed = (process.env.CREDA_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase())
}

export async function requireVerifiedUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Sign in to continue.' })
  if (!session.user.emailVerified) {
    throw createError({ statusCode: 403, statusMessage: 'Verify your email to continue.' })
  }
  return session.user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireVerifiedUser(event)
  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 403, statusMessage: 'Administrator access required.' })
  }
  return user
}

export function assertSameOrigin(event: H3Event): void {
  const origin = getHeader(event, 'origin')
  const expected = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:4002').origin
  if (origin !== expected) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin.' })
  }
}
