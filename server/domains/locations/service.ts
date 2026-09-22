import { and, count, eq, inArray, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business } from '~~/lib/db/schema'
import { listPublicBusinesses } from '@server/domains/businesses/service'
import { categoryCatalog } from '~~/shared/seo/categories'
import {
  cityLabel,
  locationStates,
  minimumLocationCategoryBusinesses,
  parseLocationParts,
  type LocationGroup,
  type LocationLink,
  type LocationPage,
} from '~~/shared/seo/locations'

const stateName = sql<string>`regexp_replace(lower(trim(${business.state})), '[[:space:]]+state$', '')`
const normalizedState = sql<string>`case when ${stateName} in ('fct', 'abuja', 'abuja fct') then 'federal capital territory' else ${stateName} end`
const normalizedCity = sql<string>`case when lower(trim(${business.city})) ~ '^[a-z][a-z .''-]{0,79}$' then trim(both '-' from regexp_replace(lower(trim(${business.city})), '[^a-z0-9]+', '-', 'g')) else '' end`
const eligible = and(
  eq(business.status, 'approved'),
  inArray(business.operationMode, ['physical', 'hybrid']),
  inArray(
    normalizedState,
    locationStates.map((state) => state.name.toLowerCase()),
  ),
)!

export async function getLocationGroups(): Promise<LocationGroup[]> {
  const rows = await db
    .select({
      state: normalizedState,
      city: normalizedCity,
      category: business.category,
      total: count(),
    })
    .from(business)
    .where(eligible)
    .groupBy(normalizedState, normalizedCity, business.category)
    .limit(5001)
  // Never publish an incomplete catalogue if the directory outgrows this bounded response.
  if (rows.length > 5000) throw new Error('location_catalog_capacity')
  return rows
}
export async function getLocationSummaries(): Promise<LocationLink[]> {
  const groups = await getLocationGroups()
  return locationStates.map((state) => ({
    name: state.name,
    path: `/locations/${state.slug}`,
    total: groups
      .filter((group) => group.state === state.name.toLowerCase())
      .reduce((total, group) => total + group.total, 0),
  }))
}
export async function getLocationPage(parts: string[], page: number): Promise<LocationPage | null> {
  const location = parseLocationParts(parts)
  if (!location) return null
  const { state, city, category } = location
  const groups = (await getLocationGroups()).filter(
    (group) => group.state === state.name.toLowerCase(),
  )
  const cityGroups = city ? groups.filter((group) => group.city === city) : groups
  if (city && !cityGroups.length) return null
  const categoryGroups = category
    ? cityGroups.filter((group) => group.category === category.value)
    : cityGroups
  const total = categoryGroups.reduce((sum, group) => sum + group.total, 0)
  if (category && total < minimumLocationCategoryBusinesses) return null
  const conditions = [eligible, eq(normalizedState, state.name.toLowerCase())]
  if (city) conditions.push(eq(normalizedCity, city))
  const result = await listPublicBusinesses(
    {
      page,
      q: '',
      category: category ? [category.value] : [],
      location: '',
      city: '',
      state: '',
      operationMode: [],
      sort: 'relevance',
    },
    conditions,
  )
  if (page > Math.max(1, Math.ceil(result.total / result.pageSize))) return null
  const statePath = `/locations/${state.slug}`
  const path = `${statePath}${city ? `/${city}` : ''}${category ? `/${category.slug}` : ''}`
  const place = city ? `${cityLabel(city)}, ${state.name}` : state.name
  const name = category ? `${category.label} in ${place}` : `Businesses in ${place}`
  const totals = new Map<string, number>()
  for (const group of groups)
    if (group.city) totals.set(group.city, (totals.get(group.city) ?? 0) + group.total)
  return {
    ...result,
    name,
    title: `${name}${page > 1 ? ` — Page ${page}` : ''} | Creda`,
    path,
    description: `Discover ${category ? category.label.toLowerCase() : 'businesses'} offering in-person services in ${place}. Compare business details, photos and customer reviews, then contact a business to plan your visit or appointment.`,
    breadcrumbs: [
      { name: 'Locations', path: '/locations' },
      { name: state.name, path: statePath },
      ...(city ? [{ name: cityLabel(city), path: `${statePath}/${city}` }] : []),
      ...(category ? [{ name: category.label, path }] : []),
    ],
    cities: [...totals]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, total]) => ({ name: cityLabel(slug), path: `${statePath}/${slug}`, total })),
    categories: city
      ? categoryCatalog
          .map((entry) => ({
            ...entry,
            total: cityGroups
              .filter((group) => group.category === entry.value)
              .reduce((sum, group) => sum + group.total, 0),
            path: `${statePath}/${city}/${entry.slug}`,
          }))
          .filter((entry) => entry.total >= minimumLocationCategoryBusinesses)
      : [],
  }
}
