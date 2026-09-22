import { ne } from 'drizzle-orm'
import { business } from '~~/lib/db/schema'
import type { BusinessListItem } from '~~/shared/businesses'
import { getPublicBusiness, listPublicBusinesses } from '@server/domains/businesses/service'

export async function listRelatedBusinesses(slug: string): Promise<BusinessListItem[] | null> {
  const source = await getPublicBusiness(slug)
  if (!source) return null

  // Reuse public visibility and rating rules. The directory query is bounded to 12 rows.
  const result = await listPublicBusinesses(
    {
      q: '',
      category: [source.category],
      location: '',
      city: '',
      state: '',
      operationMode: [],
      sort: 'relevance',
      page: 1,
    },
    [ne(business.id, source.id)],
  )
  return result.items.slice(0, 3)
}
