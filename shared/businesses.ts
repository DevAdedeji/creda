export const businessCategoryValues = [
  'software',
  'creative',
  'retail',
  'services',
  'food',
  'other',
] as const

export const businessTypeValues = [
  'web_app',
  'mobile_app',
  'desktop_app',
  'online_store',
  'service_business',
  'physical_business',
] as const

export const operationModeValues = ['online', 'physical', 'hybrid'] as const

export const businessCategories = [
  { value: 'software', label: 'Software & apps' },
  { value: 'creative', label: 'Creative & design' },
  { value: 'retail', label: 'Shopping & retail' },
  { value: 'services', label: 'Professional services' },
  { value: 'food', label: 'Food & hospitality' },
  { value: 'other', label: 'Other' },
] as const

export const businessTypes = [
  { value: 'web_app', label: 'Web app' },
  { value: 'mobile_app', label: 'Mobile app' },
  { value: 'desktop_app', label: 'Desktop app' },
  { value: 'online_store', label: 'Online store' },
  { value: 'service_business', label: 'Service business' },
  { value: 'physical_business', label: 'Physical business' },
] as const

export const operationModes = [
  { value: 'online', label: 'Online' },
  { value: 'physical', label: 'Physical' },
  { value: 'hybrid', label: 'Online and in person' },
] as const

export type BusinessCategory = (typeof businessCategoryValues)[number]
export type BusinessType = (typeof businessTypeValues)[number]
export type OperationMode = (typeof operationModeValues)[number]
export type BusinessStatus = 'pending' | 'approved' | 'rejected'
export type OwnershipStatus = 'unverified' | 'pending' | 'verified' | 'revoked'

export interface BusinessDraft {
  name: string
  description: string
  category: BusinessCategory
  businessTypes: BusinessType[]
  operationMode: OperationMode
  location: string
  googlePlaceId: string
  websiteUrl: string
  appStoreUrl: string
  playStoreUrl: string
  socialUrl: string
  contactUrl: string
  logoUrl: string
  coverUrl: string
  galleryUrls: string[]
  mediaProofs: string[]
}

export interface PublicBusiness {
  id: string
  slug: string
  name: string
  description: string
  category: BusinessCategory
  businessTypes: BusinessType[]
  operationMode: OperationMode
  location: string | null
  googlePlaceId: string | null
  websiteUrl: string | null
  appStoreUrl: string | null
  playStoreUrl: string | null
  socialUrl: string | null
  contactUrl: string | null
  logoUrl: string | null
  coverUrl: string | null
  galleryUrls: string[]
  ownershipStatus: OwnershipStatus
  publishedAt: string | null
}

export interface ManagedBusiness extends PublicBusiness {
  status: BusinessStatus
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface BusinessListItem extends PublicBusiness {
  averageRating: number | null
  reviewCount: number
}

export interface BusinessListResponse {
  items: BusinessListItem[]
  page: number
  total: number
  pageSize: number
}

export type BusinessLinks = Pick<
  BusinessDraft,
  'businessTypes' | 'websiteUrl' | 'appStoreUrl' | 'playStoreUrl' | 'socialUrl' | 'contactUrl'
>

export function businessLinkError(input: BusinessLinks): string | null {
  const types = input.businessTypes
  if (
    types.some((type) => ['web_app', 'desktop_app', 'online_store'].includes(type)) &&
    !input.websiteUrl
  ) {
    return 'Add a website or download-page link for the selected business type.'
  }
  if (types.includes('mobile_app') && !input.appStoreUrl && !input.playStoreUrl) {
    return 'Add an App Store or Google Play link for the mobile app.'
  }
  if (
    types.some((type) => ['service_business', 'physical_business'].includes(type)) &&
    !input.websiteUrl &&
    !input.socialUrl &&
    !input.contactUrl
  ) {
    return 'Add a website, official social profile, or contact link for this business.'
  }
  if (
    !input.websiteUrl &&
    !input.appStoreUrl &&
    !input.playStoreUrl &&
    !input.socialUrl &&
    !input.contactUrl
  ) {
    return 'Add at least one official link for this business.'
  }
  return null
}
