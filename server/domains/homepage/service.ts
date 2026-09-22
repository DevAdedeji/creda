import { createHash } from 'node:crypto'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import { business, homepagePlacement } from '~~/lib/db/schema'
import { listPublicBusinesses } from '@server/domains/businesses/service'
import type {
  HomepageBusinesses,
  HomepageSelection,
  HomepageSelectionInput,
} from '~~/shared/homepage'

type Placement = typeof homepagePlacement.$inferSelect

export class HomepageSelectionError extends Error {}

function revision(placements: Placement[]): string {
  return createHash('sha256')
    .update(JSON.stringify(placements.map(({ position, businessId }) => [position, businessId])))
    .digest('hex')
}

export async function getHomepageSelection(): Promise<HomepageSelection> {
  const rows = await db
    .select({
      position: homepagePlacement.position,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logoUrl: business.logoUrl,
        status: business.status,
      },
    })
    .from(homepagePlacement)
    .innerJoin(business, eq(business.id, homepagePlacement.businessId))
    .orderBy(asc(homepagePlacement.position))
  return {
    hero: rows.find((row) => row.position === 0)?.business ?? null,
    featured: rows.filter((row) => row.position > 0).map((row) => row.business),
    revision: revision(
      rows.map((row) => ({ position: row.position, businessId: row.business.id })),
    ),
  }
}

export async function saveHomepageSelection(
  input: HomepageSelectionInput,
): Promise<{ revision: string }> {
  const placements: Placement[] = [
    ...(input.heroId ? [{ position: 0, businessId: input.heroId }] : []),
    ...input.featuredIds.map((businessId, index) => ({ position: index + 1, businessId })),
  ]
  const ids = [...new Set(placements.map((item) => item.businessId))].sort()
  await db.transaction(async (tx) => {
    // Serialize whole-homepage replacements, including the initially empty selection.
    await tx.execute(sql`select pg_advisory_xact_lock(728193401)`)
    const current = await tx
      .select()
      .from(homepagePlacement)
      .orderBy(asc(homepagePlacement.position))
    if (revision(current) !== input.revision) {
      throw new HomepageSelectionError(
        'The homepage choices changed in another tab. Reload the saved choices before editing again.',
      )
    }
    if (ids.length) {
      const eligible = await tx
        .select({ id: business.id })
        .from(business)
        .where(and(inArray(business.id, ids), eq(business.status, 'approved')))
        .orderBy(asc(business.id))
        .for('share')
      if (eligible.length !== ids.length) {
        throw new HomepageSelectionError(
          'One of these businesses is no longer public. Remove or replace it before saving.',
        )
      }
    }
    await tx.delete(homepagePlacement)
    if (placements.length) await tx.insert(homepagePlacement).values(placements)
  })
  return { revision: revision(placements) }
}

export async function getHomepageBusinesses(): Promise<HomepageBusinesses> {
  const placements = await db
    .select()
    .from(homepagePlacement)
    .orderBy(asc(homepagePlacement.position))
  if (!placements.length) return { hero: null, featured: [] }
  const { items } = await listPublicBusinesses(
    {
      q: '',
      category: [],
      operationMode: [],
      location: '',
      city: '',
      state: '',
      sort: 'relevance',
      page: 1,
    },
    [
      inArray(
        business.id,
        placements.map((item) => item.businessId),
      ),
    ],
  )
  const byId = new Map(items.map((item) => [item.id, item]))
  const heroId = placements.find((item) => item.position === 0)?.businessId
  return {
    hero: heroId ? (byId.get(heroId) ?? null) : null,
    featured: placements
      .filter((item) => item.position > 0)
      .flatMap((item) => {
        const listing = byId.get(item.businessId)
        return listing ? [listing] : []
      }),
  }
}
