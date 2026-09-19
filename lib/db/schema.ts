import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { businessCategoryValues } from '../../shared/businesses'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('account_user_id_idx').on(table.userId),
    uniqueIndex('account_provider_identity_unique').on(table.providerId, table.accountId),
  ],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const businessCategory = pgEnum('business_category', businessCategoryValues)
export const businessStatus = pgEnum('business_status', [
  'pending',
  'approved',
  'rejected',
  'suspended',
])
export const ownershipStatus = pgEnum('ownership_status', [
  'unverified',
  'pending',
  'verified',
  'revoked',
])
export const businessType = pgEnum('business_type', [
  'web_app',
  'mobile_app',
  'desktop_app',
  'online_store',
  'service_business',
  'physical_business',
])
export const operationMode = pgEnum('operation_mode', ['online', 'physical', 'hybrid'])
export const listingSource = pgEnum('listing_source', ['member', 'curated'])

export const business = pgTable(
  'business',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    ownerUserId: text('owner_user_id').references(() => user.id),
    listingSource: listingSource('listing_source').notNull().default('member'),
    curationSourceUrl: text('curation_source_url'),
    curationCheckedAt: timestamp('curation_checked_at', { withTimezone: true }),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    description: text('description').notNull(),
    category: businessCategory('category').notNull(),
    businessTypes: businessType('business_types').array().notNull(),
    operationMode: operationMode('operation_mode').notNull(),
    location: text('location'),
    city: text('city'),
    state: text('state'),
    serviceArea: text('service_area'),
    openingHours: text('opening_hours'),
    weeklyHours: jsonb('weekly_hours')
      .$type<{ day: number; start: string; end: string }[]>()
      .notNull()
      .default([]),
    hoursTimeZone: text('hours_time_zone'),
    services: text('services')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    googlePlaceId: text('google_place_id'),
    normalizedLocation: text('normalized_location').notNull(),
    websiteUrl: text('website_url'),
    appStoreUrl: text('app_store_url'),
    playStoreUrl: text('play_store_url'),
    socialUrl: text('social_url'),
    contactUrl: text('contact_url'),
    logoUrl: text('logo_url'),
    coverUrl: text('cover_url'),
    galleryUrls: text('gallery_urls')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: businessStatus('status').notNull().default('approved'),
    ownershipStatus: ownershipStatus('ownership_status').notNull().default('unverified'),
    rejectionReason: text('rejection_reason'),
    reviewedByUserId: text('reviewed_by_user_id').references(() => user.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('business_name_location_unique').on(table.normalizedName, table.normalizedLocation),
    index('business_status_name_idx').on(table.status, table.name),
    index('business_status_state_city_idx').on(table.status, table.state, table.city),
    index('business_owner_idx').on(table.ownerUserId),
    check(
      'business_listing_source_owner',
      sql.raw(
        "(listing_source = 'member' AND owner_user_id IS NOT NULL) OR (listing_source = 'curated' AND owner_user_id IS NULL AND ownership_status = 'unverified' AND curation_source_url IS NOT NULL)",
      ),
    ),
    check(
      'business_destination_required',
      sql.raw(
        'website_url IS NOT NULL OR app_store_url IS NOT NULL OR play_store_url IS NOT NULL OR social_url IS NOT NULL OR contact_url IS NOT NULL',
      ),
    ),
    check(
      'business_physical_location_required',
      sql.raw(
        "operation_mode = 'online' OR (location IS NOT NULL AND length(trim(location)) >= 2)",
      ),
    ),
  ],
)

export const businessSlug = pgTable(
  'business_slug',
  {
    slug: text('slug').primaryKey(),
    businessId: text('business_id')
      .notNull()
      .references(() => business.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('business_slug_business_idx').on(table.businessId)],
)

export const businessImageUpload = pgTable(
  'business_image_upload',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    path: text('path').notNull().unique(),
    url: text('url').unique(),
    status: text('status').notNull().default('uploading'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    deleteAfter: timestamp('delete_after', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('business_image_upload_owner_created_idx').on(table.ownerUserId, table.createdAt),
    index('business_image_upload_cleanup_idx').on(table.status, table.deleteAfter),
  ],
)

export const savedBusiness = pgTable(
  'saved_business',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    businessId: text('business_id')
      .notNull()
      .references(() => business.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('saved_business_user_business_unique').on(table.userId, table.businessId),
    index('saved_business_user_created_idx').on(table.userId, table.createdAt),
  ],
)

export const businessModeration = pgTable(
  'business_moderation',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id')
      .notNull()
      .references(() => business.id),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id),
    fromStatus: businessStatus('from_status').notNull(),
    toStatus: businessStatus('to_status').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('business_moderation_business_idx').on(table.businessId, table.createdAt)],
)

export const reviewStatus = pgEnum('review_status', ['pending', 'published', 'rejected', 'removed'])

export const businessReview = pgTable(
  'business_review',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id')
      .notNull()
      .references(() => business.id),
    authorUserId: text('author_user_id')
      .notNull()
      .references(() => user.id),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    experienceMonth: text('experience_month').notNull(),
    status: reviewStatus('status').notNull().default('published'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('business_review_author_unique').on(table.businessId, table.authorUserId),
    index('business_review_business_status_created_idx').on(
      table.businessId,
      table.status,
      table.createdAt,
    ),
    check('business_review_rating_range', sql.raw('rating BETWEEN 1 AND 5')),
    check('business_review_body_length', sql.raw('length(trim(body)) BETWEEN 30 AND 2000')),
    check(
      'business_review_experience_month_format',
      sql.raw("experience_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'"),
    ),
  ],
)

export const reviewModeration = pgTable(
  'review_moderation',
  {
    id: text('id').primaryKey(),
    reviewId: text('review_id')
      .notNull()
      .references(() => businessReview.id),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id),
    fromStatus: reviewStatus('from_status').notNull(),
    toStatus: reviewStatus('to_status').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('review_moderation_review_created_idx').on(table.reviewId, table.createdAt)],
)

export const reviewReply = pgTable(
  'review_reply',
  {
    id: text('id').primaryKey(),
    reviewId: text('review_id')
      .notNull()
      .references(() => businessReview.id)
      .unique(),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => user.id),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [check('review_reply_body_length', sql.raw('length(trim(body)) BETWEEN 2 AND 1000'))],
)

export const reportStatus = pgEnum('report_status', ['open', 'dismissed', 'actioned', 'restored'])

export const contentReport = pgTable(
  'content_report',
  {
    id: text('id').primaryKey(),
    reporterUserId: text('reporter_user_id')
      .notNull()
      .references(() => user.id),
    businessId: text('business_id')
      .notNull()
      .references(() => business.id),
    reviewId: text('review_id').references(() => businessReview.id),
    reason: text('reason').notNull(),
    details: text('details'),
    status: reportStatus('status').notNull().default('open'),
    decisionReason: text('decision_reason'),
    reviewedByUserId: text('reviewed_by_user_id').references(() => user.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('content_report_open_business_unique')
      .on(table.reporterUserId, table.businessId)
      .where(sql`status = 'open' AND review_id IS NULL`),
    uniqueIndex('content_report_open_review_unique')
      .on(table.reporterUserId, table.reviewId)
      .where(sql`status = 'open' AND review_id IS NOT NULL`),
    index('content_report_status_created_idx').on(table.status, table.createdAt),
    index('content_report_business_idx').on(table.businessId),
    index('content_report_review_idx').on(table.reviewId),
    check(
      'content_report_details_length',
      sql.raw('details IS NULL OR length(trim(details)) BETWEEN 10 AND 1000'),
    ),
    check(
      'content_report_reason_allowed',
      sql.raw("reason IN ('spam', 'misleading', 'abuse', 'conflict_of_interest', 'other')"),
    ),
  ],
)

export const reportDecision = pgTable(
  'report_decision',
  {
    id: text('id').primaryKey(),
    reportId: text('report_id')
      .notNull()
      .references(() => contentReport.id),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id),
    action: text('action').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('report_decision_report_created_idx').on(table.reportId, table.createdAt)],
)

export const ownershipRequestStatus = pgEnum('ownership_request_status', [
  'pending',
  'approved',
  'declined',
  'revoked',
])

export const ownershipRequest = pgTable(
  'ownership_request',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id')
      .notNull()
      .references(() => business.id),
    requesterUserId: text('requester_user_id')
      .notNull()
      .references(() => user.id),
    method: text('method').notNull(),
    evidenceNote: text('evidence_note').notNull(),
    status: ownershipRequestStatus('status').notNull().default('pending'),
    reviewNote: text('review_note'),
    reviewedByUserId: text('reviewed_by_user_id').references(() => user.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('ownership_request_one_pending_per_requester')
      .on(table.businessId, table.requesterUserId)
      .where(sql`status = 'pending'`),
    index('ownership_request_business_created_idx').on(table.businessId, table.createdAt),
    index('ownership_request_status_created_idx').on(table.status, table.createdAt),
    check(
      'ownership_request_method_allowed',
      sql.raw("method IN ('official_email', 'official_website', 'official_social', 'other')"),
    ),
    check(
      'ownership_request_evidence_length',
      sql.raw('length(trim(evidence_note)) BETWEEN 20 AND 2000'),
    ),
  ],
)

export const ownershipDecision = pgTable(
  'ownership_decision',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => ownershipRequest.id),
    businessId: text('business_id')
      .notNull()
      .references(() => business.id),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id),
    fromStatus: ownershipRequestStatus('from_status').notNull(),
    toStatus: ownershipRequestStatus('to_status').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ownership_decision_business_created_idx').on(table.businessId, table.createdAt),
  ],
)
