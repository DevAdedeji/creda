export const directoryPageLimit = 10000

type DirectoryQuery = Record<string, string | null | undefined | (string | null)[]>

export function directoryPage(value: unknown): number | null {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) && page <= directoryPageLimit ? page : null
}

export function directoryCanonicalPath(query: DirectoryQuery): string | null {
  const page = directoryPage(query.page)
  if (page === null) return null
  // Campaign parameters do not change the results; all other variants stay out of the index.
  const hasVariants = Object.keys(query).some(
    (key) => key !== 'page' && !key.startsWith('utm_') && !['ref', 'gclid', 'fbclid'].includes(key),
  )
  return hasVariants ? null : page === 1 ? '/explore' : `/explore?page=${page}`
}

export function directoryPageOutOfRange(page: number, total: number, pageSize: number): boolean {
  return page > Math.max(1, Math.ceil(total / pageSize))
}
