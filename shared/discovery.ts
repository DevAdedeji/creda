import { z } from 'zod'
import {
  businessCategoryValues,
  operationModeValues,
  type BusinessListResponse,
} from './businesses'

export const discoveryCriteriaSchema = z.object({
  categories: z.array(z.enum(businessCategoryValues)).max(businessCategoryValues.length),
  // Match every group; alternatives within a group are synonyms (e.g. photographer / photography).
  terms: z.array(z.array(z.string().trim().min(2).max(48)).min(1).max(3)).max(3),
  city: z.string().trim().max(100),
  state: z.string().trim().max(100),
  operationModes: z.array(z.enum(operationModeValues)).max(3),
  verifiedOnly: z.boolean(),
  minRating: z.number().min(1).max(5).nullable(),
  minReviews: z.number().int().min(1).max(10000).nullable(),
  openDay: z.number().int().min(1).max(7).nullable(),
  sort: z.enum(['relevance', 'top_rated', 'most_reviewed', 'newest']),
})
export const discoveryInterpretationSchema = z.object({
  criteria: discoveryCriteriaSchema,
  searchable: z.boolean(),
  clarification: z.string().trim().max(240).nullable(),
  unsupported: z
    .array(z.enum(['price', 'distance', 'live_availability', 'country', 'other']))
    .max(5),
})
export const askDiscoverySchema = z.object({
  message: z.string().trim().min(3, 'Tell us a little more about what you need.').max(500),
})
export type DiscoveryCriteria = z.infer<typeof discoveryCriteriaSchema>
export type DiscoveryInterpretation = z.infer<typeof discoveryInterpretationSchema>
export type AskDiscoveryInput = z.infer<typeof askDiscoverySchema>
export interface DiscoveryResults extends BusinessListResponse {
  reasons: Record<string, string[]>
}
export const askDiscoveryResponseSchema = discoveryInterpretationSchema.extend({
  remaining: z.number().int().min(0),
})
export type AskDiscoveryResponse = z.infer<typeof askDiscoveryResponseSchema>
export interface DirectorySearchResponse extends BusinessListResponse {
  reasons?: DiscoveryResults['reasons']
  discovery?: DiscoveryInterpretation
}
