export type ReviewStatus = 'pending' | 'published' | 'rejected' | 'removed'

export interface PublicReview {
  id: string
  authorName: string
  rating: number
  body: string
  experienceMonth: string
  createdAt: string
  updatedAt: string
  reply: { body: string; updatedAt: string } | null
}

export interface MyReview {
  id: string
  rating: number
  body: string
  experienceMonth: string
  status: ReviewStatus
  moderationReason: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewListResponse {
  averageRating: number | null
  reviewCount: number
  reviews: PublicReview[]
  page: number
  totalPages: number
  myReview: MyReview | null
  canReview: boolean
  reviewBlocked: boolean
  isOwner: boolean
}

export interface AdminReview {
  id: string
  businessId: string
  businessName: string
  businessSlug: string
  authorName: string
  rating: number
  body: string
  experienceMonth: string
  status: ReviewStatus
  createdAt: string
  updatedAt: string
}
