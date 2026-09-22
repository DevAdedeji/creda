import type { BusinessListItem, BusinessStatus } from './businesses'

export const HOMEPAGE_FEATURED_LIMIT = 6

export interface HomepageBusiness {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  status: BusinessStatus
}

export interface HomepageSelection {
  hero: HomepageBusiness | null
  featured: HomepageBusiness[]
  revision: string
}

export interface HomepageSelectionInput {
  heroId: string | null
  featuredIds: string[]
  revision: string
}

export interface HomepageBusinesses {
  hero: BusinessListItem | null
  featured: BusinessListItem[]
}
