export const MAX_REVIEW_PHOTOS = 2
export const MAX_REVIEW_PHOTO_BYTES = 5 * 1024 * 1024

export interface ReviewPhotoDraft {
  url: string
  proof?: string
}

export type ReviewStatus = 'pending' | 'published' | 'rejected' | 'removed'

export type ReviewVoteValue = 'useful' | 'not_useful'

export interface ReviewVoteSummary {
  usefulCount: number
  notUsefulCount: number
  myVote: ReviewVoteValue | null
}

export interface PublicReview {
  votes: ReviewVoteSummary
  id: string
  authorName: string
  isAnonymous: boolean
  rating: number
  body: string
  photoUrls: string[]
  experienceMonth: string
  createdAt: string
  updatedAt: string
  reply: { body: string; updatedAt: string } | null
}

export interface MyReview {
  id: string
  isAnonymous: boolean
  rating: number
  body: string
  photoUrls: string[]
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
  isAnonymous: boolean
  rating: number
  body: string
  photoUrls: string[]
  experienceMonth: string
  status: ReviewStatus
  createdAt: string
  updatedAt: string
}
