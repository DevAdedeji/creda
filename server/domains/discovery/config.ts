import { z } from 'zod'
import { DiscoveryError } from './errors'

const dailyLimit = (fallback: number) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' ? (value.trim() === '' ? undefined : Number(value)) : value,
    z.number().int().min(0).max(10000).default(fallback),
  )
const configurationSchema = z.object({
  apiKey: z.string().trim().min(1),
  model: z
    .string()
    .trim()
    .regex(/^gemini-[a-z0-9.-]+$/),
  userDailyLimit: dailyLimit(20),
  globalDailyLimit: dailyLimit(200),
})
export type DiscoveryConfiguration = Readonly<z.output<typeof configurationSchema>>
export const discoveryProviderLimits = {
  timeoutMs: 40_000,
  connectTimeoutMs: 20_000,
  maxOutputTokens: 2048,
  maxResponseBytes: 262_144,
  maxTextLength: 12_000,
  requestsPerMinute: 3,
} as const

export function getDiscoveryConfiguration(): DiscoveryConfiguration {
  if (!process.env.GEMINI_API_KEY?.trim()) throw new DiscoveryError('configuration_missing')
  const parsed = configurationSchema.safeParse({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite',
    userDailyLimit: process.env.ASK_CREDA_DAILY_USER_LIMIT,
    globalDailyLimit: process.env.ASK_CREDA_DAILY_LIMIT,
  })
  // Never include Zod issues here: configuration errors may contain secret values.
  if (!parsed.success) throw new DiscoveryError('configuration_invalid')
  if (!parsed.data.userDailyLimit || !parsed.data.globalDailyLimit)
    throw new DiscoveryError('disabled')
  return Object.freeze(parsed.data)
}
