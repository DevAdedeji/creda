import { getLocationSummaries } from '@server/domains/locations/service'
import { locationRequest } from '@server/domains/locations/http'
export default defineEventHandler(() => locationRequest('index', getLocationSummaries))
