// An explicit null selects the existing initials avatar; a missing key is a catalog error.
export function curatedLogoUrl(slug, logos) {
  if (!Object.hasOwn(logos, slug)) throw new Error(`Missing logo decision: ${slug}`)
  const value = logos[slug]
  if (value === null) return null
  const url = new URL(value)
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'cdn.byteship.cloud' ||
    !new RegExp(`/businesses/curated/logos/${slug}-[a-f0-9]{16}\\.png$`).test(url.pathname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(`Unexpected hosted logo URL: ${slug}`)
  return value
}

export function curatedContactUrl(value) {
  if (value === undefined || value === null) return null
  if (/^tel:\+[1-9]\d{7,14}$/.test(value)) return value
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Curated contact links must use HTTPS or an international phone number.')
  }
  return value
}
