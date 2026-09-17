export const businessCategoryValues = [
  'software',
  'creative',
  'retail',
  'services',
  'food',
  'home_services',
  'health',
  'beauty',
  'automotive',
  'education',
  'fitness',
  'entertainment',
  'travel',
  'pets',
  'finance',
  'other',
] as const

export const operationModeValues = ['online', 'physical', 'hybrid'] as const

export const businessCategories = [
  { value: 'software', label: 'Software & apps' },
  { value: 'creative', label: 'Creative & design' },
  { value: 'retail', label: 'Shopping & retail' },
  { value: 'services', label: 'Professional services' },
  { value: 'food', label: 'Food & hospitality' },
  { value: 'home_services', label: 'Home services' },
  { value: 'health', label: 'Health & medical' },
  { value: 'beauty', label: 'Beauty & wellness' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'education', label: 'Education' },
  { value: 'fitness', label: 'Fitness & recreation' },
  { value: 'entertainment', label: 'Arts & entertainment' },
  { value: 'travel', label: 'Travel & accommodation' },
  { value: 'pets', label: 'Pets' },
  { value: 'finance', label: 'Financial services' },
  { value: 'other', label: 'Other' },
] as const

export const businessDays = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const

export interface BusinessHoursDay {
  day: number
  start: string
  end: string
}

export const operationModes = [
  { value: 'online', label: 'Online' },
  { value: 'physical', label: 'In person' },
  { value: 'hybrid', label: 'Online and in person' },
] as const

export type BusinessCategory = (typeof businessCategoryValues)[number]
export type OperationMode = (typeof operationModeValues)[number]
export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type OwnershipStatus = 'unverified' | 'pending' | 'verified' | 'revoked'

export interface BusinessDraft {
  name: string
  description: string
  category: BusinessCategory | ''
  operationMode: OperationMode
  location: string
  city: string
  state: string
  serviceArea: string
  openingHours: string
  weeklyHours: BusinessHoursDay[]
  hoursTimeZone: string
  services: string[]
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
  operationMode: OperationMode
  location: string | null
  city: string | null
  state: string | null
  serviceArea: string | null
  openingHours: string | null
  weeklyHours: BusinessHoursDay[]
  hoursTimeZone: string | null
  services: string[]
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

export interface BusinessCreationResponse extends ManagedBusiness {
  isFirstBusiness: boolean
}

export interface ManagedBusinessListResponse {
  items: ManagedBusiness[]
  page: number
  pageSize: number
  total: number
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
  'websiteUrl' | 'appStoreUrl' | 'playStoreUrl' | 'socialUrl' | 'contactUrl'
>

export function businessLinkError(input: BusinessLinks): string | null {
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
