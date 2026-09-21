import { eq, gte, ilike, or, sql, type SQL } from 'drizzle-orm'
import { business } from '~~/lib/db/schema'
import { businessCategories, businessDays, operationModes } from '~~/shared/businesses'
import type { DiscoveryCriteria, DiscoveryResults } from '~~/shared/discovery'
import { listPublicBusinesses } from '@server/domains/businesses/service'
import { businessListQuerySchema } from '@server/domains/businesses/validation'

const pattern = (term: string) => '%' + term.replace(/[\\%_]/g, '\\$&') + '%'

export async function searchDiscovery(
  criteria: DiscoveryCriteria,
  page = 1,
): Promise<DiscoveryResults> {
  const conditions: SQL[] = []
  for (const alternatives of criteria.terms) {
    conditions.push(
      or(
        ...alternatives.flatMap((term) => [
          ilike(business.name, pattern(term)),
          ilike(business.description, pattern(term)),
          sql`exists (select 1 from unnest(${business.services}) as service(value) where service.value ilike ${pattern(term)})`,
        ]),
      )!,
    )
  }
  if (criteria.verifiedOnly) conditions.push(eq(business.ownershipStatus, 'verified'))
  if (criteria.minRating !== null) {
    conditions.push(
      gte(
        sql`(select avg(r.rating) from business_review r where r.business_id = ${business.id} and r.status = 'published')`,
        criteria.minRating,
      ),
    )
  }
  if (criteria.minReviews !== null) {
    conditions.push(
      gte(
        sql`(select count(*) from business_review r where r.business_id = ${business.id} and r.status = 'published')`,
        criteria.minReviews,
      ),
    )
  }
  if (criteria.openDay !== null) {
    conditions.push(
      sql`exists (select 1 from jsonb_array_elements(${business.weeklyHours}) as hours where (hours->>'day')::int = ${criteria.openDay})`,
    )
  }
  const result = await listPublicBusinesses(
    businessListQuerySchema.parse({
      category: criteria.categories,
      city: criteria.city,
      state: criteria.state,
      operationMode: criteria.operationModes,
      sort: criteria.sort,
      page,
    }),
    conditions,
  )
  const reasons: Record<string, string[]> = {}
  for (const item of result.items) {
    const matches: string[] = []
    if (criteria.categories.length)
      matches.push(businessCategories.find((category) => category.value === item.category)!.label)
    for (const alternatives of criteria.terms) {
      const text = [item.name, item.description, ...item.services].join(' ').toLowerCase()
      const matched = alternatives.find((term) => text.includes(term.toLowerCase()))
      if (matched) matches.push(`Listing mentions “${matched}”`)
    }
    if (criteria.city || criteria.state)
      matches.push(
        `Listed in ${[item.city, item.state].filter(Boolean).join(', ') || item.location}`,
      )
    if (criteria.operationModes.length)
      matches.push(operationModes.find((mode) => mode.value === item.operationMode)!.label)
    if (criteria.verifiedOnly && item.ownershipStatus === 'verified')
      matches.push('Ownership verified')
    if (
      item.averageRating !== null &&
      (criteria.minRating !== null ||
        criteria.minReviews !== null ||
        criteria.sort === 'top_rated' ||
        criteria.sort === 'most_reviewed')
    ) {
      matches.push(
        `${item.averageRating}/5 from ${item.reviewCount} ${item.reviewCount === 1 ? 'review' : 'reviews'}`,
      )
    }
    if (criteria.openDay !== null) {
      const hours = item.weeklyHours.filter((hours) => hours.day === criteria.openDay)
      const day = businessDays.find((day) => day.value === criteria.openDay)?.label
      matches.push(
        `Listed ${day} hours: ${hours.map((hours) => `${hours.start}–${hours.end}`).join(', ')} (${item.hoursTimeZone})`,
      )
    }
    reasons[item.id] = matches
  }
  return { ...result, reasons }
}
