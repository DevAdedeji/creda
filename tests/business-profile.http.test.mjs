import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID, createHmac } from 'node:crypto'
import postgres from 'postgres'

const enabled = process.env.CREDA_PROFILE_DB_TESTS === '1'
test(
  'owner profile details: authorization, atomic edits, public rendering and removal',
  { skip: !enabled },
  async () => {
    process.loadEnvFile()
    const dbUrl = new URL(process.env.DATABASE_URL)
    const origin = process.env.CREDA_TEST_ORIGIN || 'http://localhost:4002'
    assert.ok(
      ['localhost', '127.0.0.1', '[::1]'].includes(dbUrl.hostname),
      'These fixtures are local-only.',
    )
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname))
    const sql = postgres(dbUrl.toString(), { max: 1 })
    const suffix = randomUUID()
    const owner = `profile-test-owner-${suffix}`
    const stranger = `profile-test-stranger-${suffix}`
    const id = `profile-test-business-${suffix}`
    const slug = `profile-test-${suffix}`
    const secret = process.env.BETTER_AUTH_SECRET
    assert.ok(secret)
    async function makeUser(userId, verified) {
      await sql`insert into "user" (id, name, email, email_verified) values (${userId}, 'Profile test', ${userId + '@example.test'}, ${verified})`
      const token = randomUUID()
      await sql`insert into session (id, user_id, token, expires_at, updated_at) values (${randomUUID()}, ${userId}, ${token}, now() + interval '1 hour', now())`
      const signature = createHmac('sha256', secret).update(token).digest('base64')
      return `better-auth.session_token=${encodeURIComponent(token + '.' + signature)}`
    }
    const blank = { offerings: [], practical: {}, faqs: [] }
    const details = {
      offerings: [
        {
          name: `Precision portrait ${suffix}`,
          kind: 'service',
          description: 'A studio portrait session.',
          price: { type: 'from', amountMinor: 2500000, currency: 'NGN', unit: 'session' },
        },
      ],
      practical: { appointments: 'yes', parking: 'no' },
      faqs: [
        {
          question: 'How do I get started?',
          answer: 'Contact the studio. <script>window.unsafe = true</script>',
        },
      ],
    }
    const request = (body, cookie, requestOrigin = origin) =>
      fetch(`${origin}/api/my/businesses/${id}/profile-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Origin: requestOrigin,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
    const publicProfile = () =>
      fetch(`${origin}/api/businesses/${slug}`).then((response) => response.json())
    try {
      const ownerCookie = await makeUser(owner, true)
      const strangerCookie = await makeUser(stranger, true)
      await sql`insert into business (id, slug, owner_user_id, name, normalized_name, description, category, business_types, operation_mode, normalized_location, website_url, status) values (${id}, ${slug}, ${owner}, 'Profile integration fixture', ${id}, 'Local-only fixture for business profile details.', 'creative', '{}', 'online', 'online', ${'https://' + slug + '.example.test'}, 'approved')`
      await sql`update business set profile_details_source = ${sql.json({ url: 'https://example.test/faq', reviewedAt: '2026-09-24' })} where id = ${id}`
      assert.equal((await request({ details, revision: 0 })).status, 401)
      assert.equal((await request({ details, revision: 0 }, strangerCookie)).status, 404)
      assert.equal(
        (await request({ details, revision: 0 }, ownerCookie, 'https://untrusted.example')).status,
        403,
      )
      await sql`update "user" set email_verified = false where id = ${owner}`
      assert.equal((await request({ details, revision: 0 }, ownerCookie)).status, 403)
      await sql`update "user" set email_verified = true where id = ${owner}`
      assert.equal(
        (
          await request(
            { details: { ...details, practical: { invented: 'yes' } }, revision: 0 },
            ownerCookie,
          )
        ).status,
        400,
      )
      const saves = await Promise.all([
        request({ details, revision: 0 }, ownerCookie),
        request({ details, revision: 0 }, ownerCookie),
      ])
      assert.deepEqual(saves.map((response) => response.status).sort(), [200, 409])
      const saved = await saves.find((response) => response.status === 200).json()
      assert.equal(saved.revision, 1)
      assert.deepEqual(saved.details, details)
      const publicData = await publicProfile()
      assert.deepEqual(publicData.profileDetails, details)
      assert.equal(publicData.profileDetailsSource, null)
      assert.ok(!('profileDetailsRevision' in publicData))
      assert.ok(!('ownerUserId' in publicData))
      const basics = Object.fromEntries(
        Object.entries(publicData).map(([key, value]) => [key, value === null ? '' : value]),
      )
      const basicsResponse = await fetch(`${origin}/api/my/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: ownerCookie },
        body: JSON.stringify({ ...basics, mediaProofs: [] }),
      })
      assert.equal(basicsResponse.status, 200)
      assert.deepEqual(
        (await publicProfile()).profileDetails,
        details,
        'Editing basics preserves separately saved details',
      )

      for (const path of [`/businesses/${slug}`, `/${slug}`]) {
        const response = await fetch(origin + path)
        assert.equal(response.status, 200)
        const html = await response.text()
        assert.match(html, /Services &amp; offerings/)
        assert.match(html, /Good to know/)
        assert.match(html, /Frequently asked questions/)
        assert.match(html, /&lt;script&gt;/)
        assert.ok(!html.includes('<script>window.unsafe'))
      }
      const search = await fetch(
        `${origin}/api/businesses?q=${encodeURIComponent(details.offerings[0].name)}`,
      ).then((response) => response.json())
      assert.ok(search.items.some((item) => item.id === id))
      await sql`update business set status = 'suspended' where id = ${id}`
      assert.equal((await request({ details: blank, revision: 1 }, ownerCookie)).status, 409)
      assert.equal((await fetch(`${origin}/api/businesses/${slug}`)).status, 404)
      await sql`update business set status = 'approved' where id = ${id}`
      assert.equal((await request({ details: blank, revision: 1 }, ownerCookie)).status, 200)
      assert.deepEqual((await publicProfile()).profileDetails, blank)
      const emptyHtml = await fetch(`${origin}/businesses/${slug}`).then((response) =>
        response.text(),
      )
      for (const heading of ['offerings-heading', 'practical-heading', 'business-faqs-heading'])
        assert.ok(!emptyHtml.includes(`id="${heading}"`))
      await assert.rejects(
        sql`update business set profile_details = ${sql.json({})} where id = ${id}`,
        { code: '23514' },
      )
    } finally {
      try {
        await sql`delete from business_insight_daily where business_id = ${id}`
        await sql`delete from business where id = ${id}`
        await sql`delete from "user" where id in (${owner}, ${stranger})`
      } finally {
        await sql.end()
      }
    }
  },
)
