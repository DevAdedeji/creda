import assert from 'node:assert/strict'
import { test } from 'node:test'
import postgres from 'postgres'
import { curatedBusinesses } from '../scripts/data/curated-businesses.mjs'
import { curatedBusinessProfiles } from '../scripts/data/curated-business-profiles.mjs'
import {
  curatedBusinessProfileSchema,
  fillEmptyCuratedProfiles,
} from '../scripts/lib/curated-business-profiles.mjs'
import { businessProfileDetailsSchema, emptyBusinessProfile } from '../shared/business-profile.ts'

test('every curated business has a bounded researched profile compatible with the editor', () => {
  assert.deepEqual(
    Object.keys(curatedBusinessProfiles).sort(),
    curatedBusinesses.map((item) => item.slug).sort(),
  )
  for (const business of curatedBusinesses) {
    const profile = curatedBusinessProfileSchema.parse(curatedBusinessProfiles[business.slug])
    businessProfileDetailsSchema.parse(profile.details)
    assert.ok(
      business.description.length >= 30 && business.description.length <= 600,
      business.slug,
    )
    assert.ok(profile.details.offerings.every((item) => item.price.type === 'unspecified'))
    assert.ok(
      !['wheelchairAccess', 'parking', 'walkIns'].some((key) => key in profile.details.practical),
    )
  }
})

test('seed validation rejects unsafe sources, unsupported claims and invented prices', () => {
  const profile = curatedBusinessProfiles.bumpa
  assert.equal(
    curatedBusinessProfileSchema.safeParse({ ...profile, sourceUrl: 'javascript:alert(1)' })
      .success,
    false,
  )
  assert.equal(
    curatedBusinessProfileSchema.safeParse({ ...profile, reviewedAt: 'yesterday' }).success,
    false,
  )
  assert.equal(
    curatedBusinessProfileSchema.safeParse({
      ...profile,
      details: { ...profile.details, practical: { wheelchairAccess: 'yes' } },
    }).success,
    false,
  )
  assert.equal(
    curatedBusinessProfileSchema.safeParse({
      ...profile,
      details: {
        ...profile.details,
        offerings: [
          {
            ...profile.details.offerings[0],
            price: { type: 'fixed', amountMinor: 100, currency: 'NGN', unit: 'month' },
          },
        ],
      },
    }).success,
    false,
  )
})

test(
  'curated enrichment fills only untouched empty listings and is idempotent',
  { skip: process.env.CREDA_SEED_DB_TESTS !== '1' },
  async () => {
    process.loadEnvFile()
    const url = new URL(process.env.DATABASE_URL)
    assert.ok(
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
      'Seed tests are local-only.',
    )
    const client = postgres(url.toString(), { max: 1 })
    const rollback = Symbol('rollback')
    try {
      await client.begin(async (sql) => {
        // Exercise the real update against the actual table shape, isolated from listings.
        await sql`CREATE TEMP TABLE business (LIKE public.business INCLUDING ALL) ON COMMIT DROP`
        const blank = emptyBusinessProfile()
        const manual = {
          ...blank,
          faqs: [{ question: 'Was this entered manually?', answer: 'Yes, keep it.' }],
        }
        for (const [slug, revision, details, owned] of [
          ['empty', 0, blank, false],
          ['manual', 0, manual, false],
          ['cleared', 2, blank, false],
          ['claimed', 0, blank, true],
          ['claim-race', 0, blank, false],
        ]) {
          await sql`INSERT INTO business (id, slug, name, normalized_name, description, category, business_types, operation_mode, normalized_location, listing_source, owner_user_id, ownership_status, curation_source_url, website_url, profile_details, profile_details_revision) VALUES (${slug}, ${slug}, ${slug}, ${slug}, 'Seed safety fixture', 'software', '{}', 'online', 'online', ${owned ? 'member' : 'curated'}, ${owned ? 'fixture-owner' : null}, ${owned ? 'verified' : 'unverified'}, 'https://example.test/', 'https://example.test/', ${sql.json(details)}, ${revision})`
        }
        const { details, sourceUrl, reviewedAt } = curatedBusinessProfiles.bumpa
        const entries = ['empty', 'manual', 'cleared', 'claimed', 'claim-race'].map((slug) => ({
          slug,
          details,
          source: { url: sourceUrl, reviewedAt },
        }))
        // Ownership changes after the work list is assembled must still win.
        await sql`UPDATE business SET listing_source = 'member', owner_user_id = 'new-owner', ownership_status = 'verified' WHERE slug = 'claim-race'`
        assert.deepEqual(
          (await fillEmptyCuratedProfiles(sql, entries)).map((row) => row.slug),
          ['empty'],
        )
        const [enriched] =
          await sql`SELECT profile_details, profile_details_source, profile_details_revision, updated_at FROM business WHERE slug = 'empty'`
        assert.deepEqual(enriched.profile_details, details)
        assert.deepEqual(enriched.profile_details_source, { url: sourceUrl, reviewedAt })
        assert.equal(enriched.profile_details_revision, 0)
        assert.equal((await fillEmptyCuratedProfiles(sql, entries)).length, 0)
        const [again] = await sql`SELECT updated_at FROM business WHERE slug = 'empty'`
        assert.deepEqual(again.updated_at, enriched.updated_at)
        const [preserved] =
          await sql`SELECT profile_details, profile_details_source FROM business WHERE slug = 'manual'`
        assert.deepEqual(preserved.profile_details, manual)
        assert.equal(preserved.profile_details_source, null)
        const [untouched] =
          await sql`SELECT count(*)::int AS count FROM business WHERE profile_details = ${sql.json(blank)}`
        assert.equal(untouched.count, 3)
        throw rollback
      })
    } catch (error) {
      if (error !== rollback) throw error
    } finally {
      await client.end()
    }
  },
)
