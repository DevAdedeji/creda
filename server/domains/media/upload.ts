import { randomUUID } from 'node:crypto'
import { createError, getHeader, readMultipartFormData, setResponseStatus, type H3Event } from 'h3'
import { z } from 'zod'
import { assertSameOrigin, requireVerifiedUser } from '@server/utils/access'
import { createMediaProof } from '@server/domains/businesses/media'
import {
  failBusinessImageUpload,
  finishBusinessImageUpload,
  reserveBusinessImageUpload,
} from '@server/domains/businesses/image-storage'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024
const apiBase = 'https://api.byteship.dev/v1/files/'

const sessionSchema = z.object({
  file: z.object({ path: z.string() }),
  upload: z.object({
    id: z.string(),
    url: z.url(),
    headers: z.record(z.string(), z.string()),
  }),
})
const completedSchema = z.object({
  file: z.object({ path: z.string(), status: z.literal('ready'), url: z.url() }),
})

function imageFormat(data: Buffer): { extension: string; contentType: string } | null {
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    return { extension: 'png', contentType: 'image/png' }
  }
  if (data.length >= 3 && data.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) {
    return { extension: 'jpg', contentType: 'image/jpeg' }
  }
  if (
    data.length >= 12 &&
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { extension: 'webp', contentType: 'image/webp' }
  }
  return null
}

async function byteshipJson(url: string, key: string, body: unknown, method: 'PUT' | 'POST') {
  const response = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Byteship API returned ${response.status}`)
  return response.json() as Promise<unknown>
}

export async function uploadImage(event: H3Event, folder: 'businesses' | 'reviews') {
  assertSameOrigin(event)
  const user = await requireVerifiedUser(event)
  const key = process.env.CREDA_BYTESHIP_API_KEY
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Image uploads are unavailable.' })

  if (!getHeader(event, 'content-type')?.startsWith('multipart/form-data')) {
    throw createError({ statusCode: 415, statusMessage: 'Choose an image to upload.' })
  }
  const length = Number(getHeader(event, 'content-length'))
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_REQUEST_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Images must be 5 MB or smaller.' })
  }
  const parts = await readMultipartFormData(event)
  const image = parts?.find((part) => part.name === 'image')
  if (!image || parts?.length !== 1 || !image.filename || !image.data.length) {
    throw createError({ statusCode: 400, statusMessage: 'Choose one image to upload.' })
  }
  if (image.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Images must be 5 MB or smaller.' })
  }
  const format = imageFormat(image.data)
  if (!format || image.type !== format.contentType) {
    throw createError({ statusCode: 415, statusMessage: 'Use a PNG, JPEG, or WebP image.' })
  }

  const path = `${folder}/${user.id}/${randomUUID()}.${format.extension}`
  const endpoint = apiBase + path
  await reserveBusinessImageUpload(user.id, path)
  try {
    const session = sessionSchema.parse(
      await byteshipJson(
        endpoint,
        key,
        {
          byteSize: image.data.length,
          contentType: format.contentType,
          method: 'single',
          visibility: 'public',
        },
        'PUT',
      ),
    )
    if (session.file.path !== path || new URL(session.upload.url).protocol !== 'https:') {
      throw new Error('Byteship returned an unexpected upload destination.')
    }
    const uploaded = await fetch(session.upload.url, {
      method: 'PUT',
      headers: session.upload.headers,
      body: new Uint8Array(image.data),
      signal: AbortSignal.timeout(30000),
    })
    if (!uploaded.ok) throw new Error(`Byteship storage returned ${uploaded.status}`)
    const completed = completedSchema.parse(
      await byteshipJson(
        `${endpoint}/upload/complete`,
        key,
        { uploadId: session.upload.id },
        'POST',
      ),
    )
    const url = new URL(completed.file.url)
    if (
      completed.file.path !== path ||
      url.protocol !== 'https:' ||
      url.hostname !== 'cdn.byteship.cloud' ||
      !url.pathname.endsWith(`/${path}`)
    ) {
      throw new Error('Byteship returned an unexpected file URL.')
    }
    await finishBusinessImageUpload(path, url.toString())
    setResponseStatus(event, 201)
    return { url: url.toString(), proof: createMediaProof(user.id, url.toString()) }
  } catch (error) {
    await failBusinessImageUpload(path)
    console.error('Image upload failed:', error instanceof Error ? error.message : error)
    throw createError({ statusCode: 502, statusMessage: 'Image upload failed. Please try again.' })
  }
}
