import { createHmac, timingSafeEqual } from 'node:crypto'
import { createError } from 'h3'
import type { BusinessSubmissionInput } from './validation'

const PROOF_LIFETIME_MS = 24 * 60 * 60 * 1000

function signingKey(): string {
  const key = process.env.BETTER_AUTH_SECRET
  if (!key) throw new Error('BETTER_AUTH_SECRET is required for image uploads.')
  return key
}

export function createMediaProof(userId: string, url: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, url, expiresAt: Date.now() + PROOF_LIFETIME_MS }),
  ).toString('base64url')
  const signature = createHmac('sha256', signingKey())
    .update(`creda-media:${payload}`)
    .digest('base64url')
  return `${payload}.${signature}`
}

function proofMatches(proof: string, userId: string, url: string): boolean {
  const [payload, signature, extra] = proof.split('.')
  if (!payload || !signature || extra) return false
  const expected = createHmac('sha256', signingKey()).update(`creda-media:${payload}`).digest()
  const received = Buffer.from(signature, 'base64url')
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false
  try {
    const value: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return (
      typeof value === 'object' &&
      value !== null &&
      'userId' in value &&
      value.userId === userId &&
      'url' in value &&
      value.url === url &&
      'expiresAt' in value &&
      typeof value.expiresAt === 'number' &&
      value.expiresAt > Date.now()
    )
  } catch {
    return false
  }
}

export function validateBusinessMedia(
  userId: string,
  input: BusinessSubmissionInput,
  existing?: { logoUrl: string | null; coverUrl: string | null; galleryUrls: string[] },
): void {
  const previous = new Set(
    existing ? [existing.logoUrl, existing.coverUrl, ...existing.galleryUrls].filter(Boolean) : [],
  )
  const selected = [input.logoUrl, input.coverUrl, ...input.galleryUrls].filter(
    (url): url is string => Boolean(url),
  )
  validateMediaUrls(
    userId,
    selected,
    input.mediaProofs,
    [...previous].filter((url): url is string => Boolean(url)),
  )
}

export function validateMediaUrls(
  userId: string,
  selected: string[],
  proofs: string[],
  existing: string[] = [],
): void {
  const previous = new Set(existing)
  for (const url of selected) {
    if (previous.has(url)) continue
    if (!proofs.some((proof) => proofMatches(proof, userId, url))) {
      throw createError({ statusCode: 400, statusMessage: 'Upload the selected image again.' })
    }
  }
}
