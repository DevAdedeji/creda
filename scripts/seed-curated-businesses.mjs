import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import postgres from 'postgres'
import { curatedBusinesses } from './data/curated-businesses.mjs'
import { curatedLogoUrls } from './data/curated-logo-urls.mjs'

// Railway injects its database URL. Do not supplement it from a local .env.
if (!process.env.DIRECT_URL && !process.env.DATABASE_URL && existsSync('.env')) {
  process.loadEnvFile()
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const check = args.includes('--check')
const allowed = new Set(['--apply', '--check'])
if (args.some((arg) => !allowed.has(arg))) throw new Error('Use --apply or --check.')
if (apply && check) throw new Error('Choose --apply or --check, not both.')

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL
if (!connectionString) throw new Error('DATABASE_URL or DIRECT_URL is required.')
const databaseUrl = new URL(connectionString)
const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1))

const normalizedKey = (value) =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
const canonicalSite = (value) => {
  const parsed = new URL(value)
  return parsed.hostname.toLowerCase().replace(/^www\./, '')
}
const businessTypesFor = (item) => {
  const mode = item.operationMode || 'online'
  const types = []
  if (item.websiteUrl) types.push('web_app')
  if (item.appStoreUrl || item.playStoreUrl) types.push('mobile_app')
  if (mode === 'physical') types.push('physical_business')
  if (mode === 'hybrid') types.push('service_business')
  return [...new Set(types)]
}

const validatedStoreUrl = (value, hostname, slug) => {
  if (!value) return
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== hostname) {
    throw new Error(`Invalid app store URL: ${slug}`)
  }
}

const slugs = new Set()
const names = new Set()
const sites = new Set()
for (const item of curatedBusinesses) {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(item.slug)) {
    throw new Error(`Invalid seed slug: ${item.slug}`)
  }
  if (item.description.length < 30 || item.description.length > 600) {
    throw new Error(`Description outside form limits: ${item.slug}`)
  }
  if (!['http:', 'https:'].includes(new URL(item.websiteUrl).protocol)) {
    throw new Error(`Invalid site URL: ${item.slug}`)
  }
  if (!['http:', 'https:'].includes(new URL(item.sourceUrl).protocol)) {
    throw new Error(`Invalid source URL: ${item.slug}`)
  }
  validatedStoreUrl(item.appStoreUrl, 'apps.apple.com', item.slug)
  validatedStoreUrl(item.playStoreUrl, 'play.google.com', item.slug)
  if (Boolean(item.city) !== Boolean(item.state)) {
    throw new Error(`City and state must be supplied together: ${item.slug}`)
  }
  if ((item.operationMode || 'online') !== 'online' && !item.location) {
    throw new Error(`Physical listing needs a location: ${item.slug}`)
  }
  const logoUrl = curatedLogoUrls[item.slug]
  if (!logoUrl) throw new Error(`Missing hosted logo URL: ${item.slug}`)
  const logo = new URL(logoUrl)
  if (
    logo.protocol !== 'https:' ||
    logo.hostname !== 'cdn.byteship.cloud' ||
    !new RegExp(`/businesses/curated/logos/${item.slug}-[a-f0-9]{16}\\.png$`).test(logo.pathname)
  ) {
    throw new Error(`Unexpected hosted logo URL: ${item.slug}`)
  }
  if (
    slugs.has(item.slug) ||
    names.has(normalizedKey(item.name)) ||
    sites.has(canonicalSite(item.websiteUrl))
  ) {
    throw new Error(`Duplicate entry in curated catalog: ${item.slug}`)
  }
  slugs.add(item.slug)
  names.add(normalizedKey(item.name))
  sites.add(canonicalSite(item.websiteUrl))
}
if (Object.keys(curatedLogoUrls).length !== curatedBusinesses.length) {
  throw new Error('Curated logo URLs and business catalog have different sizes.')
}

const client = postgres(connectionString, { max: 1, onnotice: () => {} })
const rollbackCheck = Symbol('rollback check')
try {
  await client.begin(async (sql) => {
    if (apply || check) await sql`SELECT pg_advisory_xact_lock(1740312)`
    const existing = await sql`
      SELECT id, slug, normalized_name, website_url, listing_source, owner_user_id,
        ownership_status
      FROM business
    `
    const usedSlugs = await sql`SELECT slug FROM business_slug`
    const occupiedSlugs = new Set([
      ...existing.map((row) => row.slug),
      ...usedSlugs.map((row) => row.slug),
    ])
    const occupiedNames = new Set(existing.map((row) => row.normalized_name))
    const occupiedSites = new Set(
      existing.filter((row) => row.website_url).map((row) => canonicalSite(row.website_url)),
    )
    const existingBySlug = new Map(existing.map((row) => [row.slug, row]))
    const pending = []
    const managed = []
    const skipped = []
    for (const item of curatedBusinesses) {
      const matched = existingBySlug.get(item.slug)
      if (matched) {
        if (
          matched.listing_source === 'curated' &&
          matched.owner_user_id === null &&
          matched.ownership_status === 'unverified'
        ) {
          managed.push({ item, id: matched.id })
        } else {
          skipped.push(item.slug)
        }
        continue
      }
      const collision =
        occupiedSlugs.has(item.slug) ||
        occupiedNames.has(normalizedKey(item.name)) ||
        occupiedSites.has(canonicalSite(item.websiteUrl))
      if (collision) skipped.push(item.slug)
      else pending.push(item)
    }

    console.log(
      `${apply ? 'Applying' : check ? 'Rollback check' : 'Dry run'} curated seed for ${databaseUrl.hostname}/${databaseName}: ${pending.length} new, ${managed.length} managed, ${skipped.length} skipped.`,
    )
    if (skipped.length) console.log(`Claimed or conflicting entries: ${skipped.join(', ')}`)
    if (!apply && !check) {
      if (pending.length) console.log(`Would add: ${pending.map((item) => item.slug).join(', ')}`)
      if (managed.length) {
        console.log(`Would refresh: ${managed.map(({ item }) => item.slug).join(', ')}`)
      }
      return
    }

    let updatedCount = 0
    for (const { item, id } of managed) {
      const mode = item.operationMode || 'online'
      const location = item.location || null
      const city = item.city || null
      const state = item.state || null
      const appStoreUrl = item.appStoreUrl || null
      const playStoreUrl = item.playStoreUrl || null
      const businessTypes = businessTypesFor(item)
      const normalizedLocation = normalizedKey(
        location || [city, state].filter(Boolean).join(', ') || 'online',
      )
      const updated = await sql`
        UPDATE business
        SET curation_source_url = ${item.sourceUrl}, curation_checked_at = NOW(),
          name = ${item.name}, normalized_name = ${normalizedKey(item.name)},
          description = ${item.description}, category = ${item.category},
          business_types = ${businessTypes}::business_type[], operation_mode = ${mode},
          location = ${location}, city = ${city}, state = ${state},
          normalized_location = ${normalizedLocation}, website_url = ${item.websiteUrl},
          app_store_url = ${appStoreUrl}, play_store_url = ${playStoreUrl},
          logo_url = ${curatedLogoUrls[item.slug]}, updated_at = NOW()
        WHERE id = ${id}
          AND listing_source = 'curated'
          AND owner_user_id IS NULL
          AND ownership_status = 'unverified'
          AND (
            curation_source_url IS DISTINCT FROM ${item.sourceUrl}
            OR name IS DISTINCT FROM ${item.name}
            OR normalized_name IS DISTINCT FROM ${normalizedKey(item.name)}
            OR description IS DISTINCT FROM ${item.description}
            OR category IS DISTINCT FROM ${item.category}::business_category
            OR business_types IS DISTINCT FROM ${businessTypes}::business_type[]
            OR operation_mode IS DISTINCT FROM ${mode}::operation_mode
            OR location IS DISTINCT FROM ${location}
            OR city IS DISTINCT FROM ${city}
            OR state IS DISTINCT FROM ${state}
            OR normalized_location IS DISTINCT FROM ${normalizedLocation}
            OR website_url IS DISTINCT FROM ${item.websiteUrl}
            OR app_store_url IS DISTINCT FROM ${appStoreUrl}
            OR play_store_url IS DISTINCT FROM ${playStoreUrl}
            OR logo_url IS DISTINCT FROM ${curatedLogoUrls[item.slug]}
          )
        RETURNING id
      `
      updatedCount += updated.length
    }

    for (const item of pending) {
      const id = randomUUID()
      const mode = item.operationMode || 'online'
      const location = item.location || null
      const city = item.city || null
      const state = item.state || null
      const appStoreUrl = item.appStoreUrl || null
      const playStoreUrl = item.playStoreUrl || null
      const businessTypes = businessTypesFor(item)
      await sql`
        INSERT INTO business (
          id, slug, owner_user_id, listing_source, curation_source_url, curation_checked_at,
          name, normalized_name, description, category, business_types, operation_mode,
          location, city, state, normalized_location, website_url, app_store_url,
          play_store_url, logo_url, status, ownership_status, published_at
        ) VALUES (
          ${id}, ${item.slug}, NULL, 'curated', ${item.sourceUrl}, NOW(),
          ${item.name}, ${normalizedKey(item.name)}, ${item.description}, ${item.category},
          ${businessTypes}::business_type[], ${mode}, ${location}, ${city}, ${state},
          ${normalizedKey(location || [city, state].filter(Boolean).join(', ') || 'online')},
          ${item.websiteUrl}, ${appStoreUrl}, ${playStoreUrl}, ${curatedLogoUrls[item.slug]},
          'approved', 'unverified', NOW()
        )
      `
      await sql`INSERT INTO business_slug (slug, business_id) VALUES (${item.slug}, ${id})`
    }
    if (check) throw rollbackCheck
    console.log(`Inserted ${pending.length} and refreshed ${updatedCount} curated businesses.`)
  })
} catch (error) {
  if (error === rollbackCheck)
    console.log('All curated inserts and updates checked; transaction rolled back without saving.')
  else {
    console.error(
      'Curated seed failed; transaction rolled back:',
      error instanceof Error ? error.message : error,
    )
    process.exitCode = 1
  }
} finally {
  await client.end()
}
