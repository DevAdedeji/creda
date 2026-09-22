import { sql } from 'drizzle-orm'
import { db } from '~~/lib/db'
import {
  business,
  businessReview,
  contentReport,
  ownershipRequest,
  savedBusiness,
  user,
} from '~~/lib/db/schema'
import type { AdminOverview, AdminOverviewPeriod } from '~~/shared/admin'

export async function getAdminOverview(days: AdminOverviewPeriod): Promise<AdminOverview> {
  // Include today and the preceding calendar days in Nigeria, using the database clock.
  const startsAt =
    days === 'all'
      ? sql`'-infinity'::timestamptz`
      : sql`((date_trunc('day', now() at time zone 'Africa/Lagos') - (${days}::integer - 1) * interval '1 day') at time zone 'Africa/Lagos')`
  return db.transaction(
    async (tx) => {
      const [users] = await tx
        .select({
          total: sql`count(*)`.mapWith(Number),
          emailVerified: sql`count(*) filter (where ${user.emailVerified})`.mapWith(Number),
          added:
            sql`count(*) filter (where ${user.createdAt} between ${startsAt} and now())`.mapWith(
              Number,
            ),
          generatedAt: sql<string>`to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
          startsAt:
            days === 'all'
              ? sql<string | null>`null::text`
              : sql<
                  string | null
                >`to_char((${startsAt}) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
        })
        .from(user)
      const [businesses] = await tx
        .select({
          total: sql`count(*)`.mapWith(Number),
          businessOwners: sql`count(distinct ${business.ownerUserId})`.mapWith(Number),
          public: sql`count(*) filter (where ${business.status} = 'approved')`.mapWith(Number),
          verified: sql`count(*) filter (where ${business.ownershipStatus} = 'verified')`.mapWith(
            Number,
          ),
          managed: sql`count(*) filter (where ${business.ownerUserId} is not null)`.mapWith(Number),
          curated: sql`count(*) filter (where ${business.listingSource} = 'curated')`.mapWith(
            Number,
          ),
          suspended: sql`count(*) filter (where ${business.status} = 'suspended')`.mapWith(Number),
          added:
            sql`count(*) filter (where ${business.createdAt} between ${startsAt} and now())`.mapWith(
              Number,
            ),
        })
        .from(business)
      const [reviews] = await tx
        .select({
          total: sql`count(*)`.mapWith(Number),
          published: sql`count(*) filter (where ${businessReview.status} = 'published')`.mapWith(
            Number,
          ),
          removed: sql`count(*) filter (where ${businessReview.status} = 'removed')`.mapWith(
            Number,
          ),
          averageRating: sql<
            number | null
          >`round(avg(${businessReview.rating}) filter (where ${businessReview.status} = 'published'), 1)`.mapWith(
            (value) => (value === null ? null : Number(value)),
          ),
          added:
            sql`count(*) filter (where ${businessReview.createdAt} between ${startsAt} and now())`.mapWith(
              Number,
            ),
        })
        .from(businessReview)
      const [saves] = await tx
        .select({
          total: sql`count(*)`.mapWith(Number),
          added:
            sql`count(*) filter (where ${savedBusiness.createdAt} between ${startsAt} and now())`.mapWith(
              Number,
            ),
        })
        .from(savedBusiness)
      const [claims] = await tx
        .select({
          pending: sql`count(*) filter (where ${ownershipRequest.status} = 'pending')`.mapWith(
            Number,
          ),
        })
        .from(ownershipRequest)
      const [reports] = await tx
        .select({
          businessReports:
            sql`count(*) filter (where ${contentReport.status} = 'open' and ${contentReport.reviewId} is null)`.mapWith(
              Number,
            ),
          reviewReports:
            sql`count(*) filter (where ${contentReport.status} = 'open' and ${contentReport.reviewId} is not null)`.mapWith(
              Number,
            ),
        })
        .from(contentReport)

      if (!users || !businesses || !reviews || !saves || !claims || !reports) {
        throw new Error('Admin overview aggregates were not returned')
      }
      const { businessOwners, ...businessTotals } = businesses
      return {
        generatedAt: users.generatedAt,
        period: { days, startsAt: users.startsAt, timeZone: 'Africa/Lagos' },
        users: {
          total: users.total,
          emailVerified: users.emailVerified,
          businessOwners,
          added: users.added,
        },
        businesses: businessTotals,
        reviews,
        saves,
        attention: { ownershipRequests: claims.pending, ...reports },
      }
    },
    { isolationLevel: 'repeatable read', accessMode: 'read only' },
  )
}
