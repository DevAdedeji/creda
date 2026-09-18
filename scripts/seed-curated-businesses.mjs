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
      SELECT id, slug, normalized_name, website_url, listing_source
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
    const pending = []
    const skipped = []
    for (const item of curatedBusinesses) {
      const collision =
        occupiedSlugs.has(item.slug) ||
        occupiedNames.has(normalizedKey(item.name)) ||
        occupiedSites.has(canonicalSite(item.websiteUrl))
      if (collision) skipped.push(item.slug)
      else pending.push(item)
    }

    console.log(
      `${apply ? 'Applying' : check ? 'Rollback check' : 'Dry run'} curated seed for ${databaseUrl.hostname}/${databaseName}: ${pending.length} new, ${skipped.length} skipped.`,
    )
    if (skipped.length) console.log(`Existing or conflicting entries: ${skipped.join(', ')}`)
    if (!apply && !check) {
      if (pending.length) console.log(`Would add: ${pending.map((item) => item.slug).join(', ')}`)
      return
    }

    for (const item of pending) {
      const id = randomUUID()
      const mode = item.operationMode || 'online'
      const location = item.location || null
      const businessTypes =
        mode === 'online'
          ? ['web_app']
          : mode === 'physical'
            ? ['physical_business']
            : ['service_business']
      await sql`
        INSERT INTO business (
          id, slug, owner_user_id, listing_source, curation_source_url, curation_checked_at,
          name, normalized_name, description, category, business_types, operation_mode,
          location, normalized_location, website_url, logo_url, status, ownership_status, published_at
        ) VALUES (
          ${id}, ${item.slug}, NULL, 'curated', ${item.sourceUrl}, NOW(),
          ${item.name}, ${normalizedKey(item.name)}, ${item.description}, ${item.category},
          ${businessTypes}::business_type[], ${mode}, ${location}, ${normalizedKey(location || 'online')},
          ${item.websiteUrl}, ${curatedLogoUrls[item.slug]}, 'approved', 'unverified', NOW()
        )
      `
      await sql`INSERT INTO business_slug (slug, business_id) VALUES (${item.slug}, ${id})`
    }
    if (check) throw rollbackCheck
    console.log(`Inserted ${pending.length} curated businesses.`)
  })
} catch (error) {
  if (error === rollbackCheck)
    console.log('All inserts checked; transaction rolled back without saving.')
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
