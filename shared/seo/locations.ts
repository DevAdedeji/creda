import { matchingNigeriaState, nigeriaStates } from '../nigeriaStates'
import { getBusinessCategory, type CategorySummary } from './categories'
import type { BusinessListResponse, OperationMode } from '../businesses'

export const minimumLocationCategoryBusinesses = 3
export const locationStates = nigeriaStates.map((name) => ({
  name,
  slug: name.toLowerCase().replaceAll(' ', '-'),
}))
export type LocationState = (typeof locationStates)[number]
export interface LocationLink {
  name: string
  path: string
  total: number
}
export interface LocationGroup {
  state: string
  city: string
  category: string
  total: number
}
export interface LocationPage extends BusinessListResponse {
  name: string
  title: string
  description: string
  path: string
  breadcrumbs: { name: string; path: string }[]
  cities: LocationLink[]
  categories: (CategorySummary & { path: string })[]
}
export function citySlug(value: string): string | null {
  const name = value.trim().toLowerCase()
  if (!/^[a-z][a-z .'-]{0,79}$/.test(name)) return null
  return name.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null
}
export function cityLabel(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
export function getLocationState(slug: string): LocationState | undefined {
  return locationStates.find((state) => state.slug === slug)
}
export function parseLocationParts(parts: string[]): {
  state: LocationState
  city?: string
  category?: NonNullable<ReturnType<typeof getBusinessCategory>>
} | null {
  if (parts.length < 1 || parts.length > 3) return null
  const state = getLocationState(parts[0]!)
  if (!state) return null
  const city = parts[1]
  if (city !== undefined && (citySlug(city.replaceAll('-', ' ')) !== city || city.length > 80))
    return null
  const category = parts[2] ? getBusinessCategory(parts[2]) : undefined
  if (parts.length === 3 && !category) return null
  return { state, city, category }
}
export function businessLocationPath(item: {
  state: string | null
  city: string | null
  operationMode: OperationMode
}): string | null {
  if (item.operationMode === 'online' || !item.state) return null
  const name = matchingNigeriaState(item.state)
  const state = locationStates.find((entry) => entry.name === name)
  if (!state) return null
  const city = item.city ? citySlug(item.city) : null
  return `/locations/${state.slug}${city ? `/${city}` : ''}`
}
export function locationSitemapPaths(groups: LocationGroup[]): string[] {
  const paths = new Set<string>()
  for (const group of groups) {
    const state = locationStates.find((entry) => entry.name.toLowerCase() === group.state)
    if (!state || group.total < 1) continue
    paths.add('/locations')
    const path = `/locations/${state.slug}`
    paths.add(path)
    if (!group.city || citySlug(group.city.replaceAll('-', ' ')) !== group.city) continue
    paths.add(`${path}/${group.city}`)
    if (group.total >= minimumLocationCategoryBusinesses) {
      const category = getBusinessCategory(group.category.replaceAll('_', '-'))
      if (category) paths.add(`${path}/${group.city}/${category.slug}`)
    }
  }
  return [...paths].sort()
}
