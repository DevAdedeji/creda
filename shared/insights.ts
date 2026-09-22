export const insightMetrics = [
  'profile_view',
  'bio_view',
  'website',
  'whatsapp',
  'phone',
  'app_store',
  'play_store',
  'social',
  'email',
  'contact',
] as const
export type InsightMetric = (typeof insightMetrics)[number]
export const insightDestinationKeys = [
  'websiteUrl',
  'appStoreUrl',
  'playStoreUrl',
  'socialUrl',
  'contactUrl',
] as const
export type InsightDestinationKey = (typeof insightDestinationKeys)[number]
export type InsightSurface = 'profile' | 'bio'
export type InsightRange = 7 | 30
export type InsightEvent =
  | { businessId: string; surface: InsightSurface; action: 'view' }
  | {
      businessId: string
      surface: InsightSurface
      action: 'click'
      destination: InsightDestinationKey
    }
export const insightLinkLabels: Record<
  Exclude<InsightMetric, 'profile_view' | 'bio_view'>,
  string
> = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
  app_store: 'Apple App Store',
  play_store: 'Google Play Store',
  social: 'Social profile',
  email: 'Email',
  contact: 'Other contact links',
}
export interface BusinessInsights {
  business: { id: string; name: string; slug: string; logoUrl: string | null }
  range: InsightRange
  from: string
  through: string
  metrics: Record<InsightMetric, number>
  saves: number
  newReviews: number
  totalReviews: number
  averageRating: number | null
  activity: { date: string; views: number; clicks: number }[]
}
