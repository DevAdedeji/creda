import type {
  BusinessProfileDetails,
  BusinessProfileDetailsResponse,
} from '~~/shared/business-profile'
export function saveBusinessProfileDetails(
  id: string,
  details: BusinessProfileDetails,
  revision: number,
): Promise<BusinessProfileDetailsResponse> {
  return $fetch(`/api/my/businesses/${encodeURIComponent(id)}/profile-details`, {
    method: 'PUT',
    body: { details, revision },
    retry: 0,
  })
}
