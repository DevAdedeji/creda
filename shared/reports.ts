export const reportReasons = [
  { value: 'spam', label: 'Spam or promotion' },
  { value: 'misleading', label: 'Misleading information' },
  { value: 'abuse', label: 'Harassment or harmful content' },
  { value: 'conflict_of_interest', label: 'Conflict of interest' },
  { value: 'other', label: 'Something else' },
] as const

export type ReportStatus = 'open' | 'dismissed' | 'actioned' | 'restored'

export interface AdminReport {
  id: string
  businessId: string
  businessName: string
  businessDescription: string
  businessStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
  businessSlug: string
  reviewId: string | null
  reviewPhotoUrls: string[] | null
  reviewBody: string | null
  reporterName: string
  reason: string
  details: string | null
  status: ReportStatus
  decisionReason: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface AdminReportList {
  items: AdminReport[]
  page: number
  totalPages: number
}
