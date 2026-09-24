import { createError, getHeader, readRawBody, type H3Event } from 'h3'
import { z } from 'zod'

const MAX_BODY_BYTES = 16_384

export async function readValidatedJson<T extends z.ZodType>(
  event: H3Event,
  schema: T,
  maxBodyBytes = MAX_BODY_BYTES,
): Promise<z.output<T>> {
  if (!getHeader(event, 'content-type')?.toLowerCase().startsWith('application/json')) {
    throw createError({ statusCode: 415, statusMessage: 'Send JSON data.' })
  }

  const declaredLength = Number(getHeader(event, 'content-length') ?? 0)
  if (declaredLength > maxBodyBytes) {
    throw createError({ statusCode: 413, statusMessage: 'Request is too large.' })
  }

  const raw = await readRawBody(event, 'utf8')
  if (!raw || Buffer.byteLength(raw) > maxBodyBytes) {
    throw createError({ statusCode: raw ? 413 : 400, statusMessage: 'Invalid request body.' })
  }

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON.' })
  }

  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid request data.',
    })
  }
  return parsed.data
}
