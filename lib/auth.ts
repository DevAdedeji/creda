import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './db/schema'
import { sendAccountEmail } from './email/send'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:4002'
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together')
}

export const auth = betterAuth({
  appName: 'Creda',
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL],
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendAccountEmail({
        to: user.email,
        subject: 'Reset your Creda password',
        heading: 'Reset your password',
        body: 'We received a request to reset your Creda password. Use the link below to choose a new one.',
        action: { label: 'Choose a new password', url },
        footer: 'If you did not request this, you can safely ignore this email.',
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendAccountEmail({
        to: user.email,
        subject: 'Verify your Creda email',
        heading: 'Confirm your email',
        body: 'Confirm your email address to finish setting up your Creda account.',
        action: { label: 'Confirm my email', url },
        footer: 'If you did not create a Creda account, you can safely ignore this email.',
      })
    },
  },
  account: {
    encryptOAuthTokens: true,
    accountLinking: { disableImplicitLinking: true },
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {},
})
