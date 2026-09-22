export type AdminOverviewPeriod = 7 | 30

export interface AdminOverview {
  generatedAt: string
  period: { days: AdminOverviewPeriod; startsAt: string; timeZone: 'Africa/Lagos' }
  users: { total: number; emailVerified: number; businessOwners: number; added: number }
  businesses: {
    total: number
    public: number
    verified: number
    managed: number
    curated: number
    suspended: number
    added: number
  }
  reviews: {
    total: number
    published: number
    removed: number
    averageRating: number | null
    added: number
  }
  saves: { total: number; added: number }
  attention: { ownershipRequests: number; businessReports: number; reviewReports: number }
}
