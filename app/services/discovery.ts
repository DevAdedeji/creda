import { z } from 'zod'
import { askDiscoveryResponseSchema, type AskDiscoveryResponse } from '~~/shared/discovery'

export async function interpretBusinessSearch(
  message: string,
  signal: AbortSignal,
): Promise<AskDiscoveryResponse> {
  const response = await $fetch<unknown>('/api/discovery/ask', {
    method: 'POST',
    body: { message },
    signal,
    timeout: 50_000,
    retry: 0,
  })
  return askDiscoveryResponseSchema.parse(response)
}

const searchFailureSchema = z.object({
  statusCode: z.number(),
  data: z.object({
    statusMessage: z.string().min(1).max(240).optional(),
    data: z.object({ message: z.string().min(1).max(240) }).optional(),
  }),
})

export function searchFailureNotice(error: unknown): string {
  const failure = searchFailureSchema.safeParse(error)
  const message =
    failure.success && [400, 401, 403, 422, 429, 502, 503].includes(failure.data.statusCode)
      ? (failure.data.data.data?.message ??
        failure.data.data.statusMessage ??
        'We couldn’t interpret that search right now.')
      : 'We couldn’t interpret that search right now.'
  return message
}
