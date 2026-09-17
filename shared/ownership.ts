import type { OwnershipStatus } from './businesses'

export const ownershipMethods = [
  { value: 'official_email', label: 'Official business email' },
  { value: 'official_website', label: 'Official website' },
  { value: 'official_social', label: 'Official social profile' },
  { value: 'other', label: 'Another official channel' },
] as const

export type OwnershipMethod = (typeof ownershipMethods)[number]['value']
export type OwnershipRequestStatus = 'pending' | 'approved' | 'declined' | 'revoked'

export interface OwnershipRequestView {
  id: string
  method: OwnershipMethod
  evidenceNote: string
  status: OwnershipRequestStatus
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface OwnerVerificationView {
  businessId: string
  businessName: string
  ownershipStatus: OwnershipStatus
  request: OwnershipRequestView | null
}

export interface AdminVerificationItem extends OwnershipRequestView {
  businessId: string
  businessName: string
  businessSlug: string
  ownerName: string
  ownerEmail: string
}
