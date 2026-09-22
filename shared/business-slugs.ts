const reservedBusinessSlugs = new Set([
  'about',
  'account',
  'admin',
  'api',
  'app',
  'auth',
  'blog',
  'businesses',
  'categories',
  'contact',
  'dashboard',
  'explore',
  'forgot-password',
  'help',
  'login',
  'locations',
  'new',
  'pricing',
  'privacy',
  'profile',
  'reset-password',
  'saved',
  'search',
  'settings',
  'signup',
  'sitemap',
  'support',
  'terms',
  'verify',
  'www',
  'creda',
])

export function isAvailableBusinessSlugFormat(value: string): boolean {
  return (
    /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/.test(value) &&
    value.length >= 3 &&
    !reservedBusinessSlugs.has(value)
  )
}
