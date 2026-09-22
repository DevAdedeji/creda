import { count, eq } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business } from '~~/lib/db/schema'
import { categoryCatalog, type CategorySummary } from '~~/shared/seo/categories'
import type { BusinessCategory, BusinessListResponse } from '~~/shared/businesses'
import { listPublicBusinesses } from '@server/domains/businesses/service'

export async function getCategorySummaries(): Promise<CategorySummary[]> {
  const rows = await db
    .select({ category: business.category, total: count() })
    .from(business)
    .where(eq(business.status, 'approved'))
    .groupBy(business.category)
  const totals = new Map(rows.map((row) => [row.category, row.total]))
  return categoryCatalog.map((category) => ({
    ...category,
    total: totals.get(category.value) ?? 0,
  }))
}

export async function getCategoryBusinesses(
  category: BusinessCategory,
  page: number,
): Promise<BusinessListResponse> {
  return listPublicBusinesses({
    category: [category],
    page,
    q: '',
    location: '',
    city: '',
    state: '',
    operationMode: [],
    sort: 'relevance',
  })
}
