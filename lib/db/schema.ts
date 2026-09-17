import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
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
export const businessStatus = pgEnum('business_status', ['pending', 'approved', 'rejected'])
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

export const business = pgTable(
  'business',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => user.id),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    description: text('description').notNull(),
    category: businessCategory('category').notNull(),
    businessTypes: businessType('business_types').array().notNull(),
    operationMode: operationMode('operation_mode').notNull(),
    location: text('location'),
    normalizedLocation: text('normalized_location').notNull(),
    websiteUrl: text('website_url'),
    appStoreUrl: text('app_store_url'),
    playStoreUrl: text('play_store_url'),
    socialUrl: text('social_url'),
    contactUrl: text('contact_url'),
    logoUrl: text('logo_url'),
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
    index('business_owner_idx').on(table.ownerUserId),
    check(
      'business_destination_required',
      sql.raw(
        'website_url IS NOT NULL OR app_store_url IS NOT NULL OR play_store_url IS NOT NULL OR social_url IS NOT NULL OR contact_url IS NOT NULL',
      ),
    ),
    check('business_types_required', sql.raw('cardinality(business_types) > 0')),
    check(
      'business_physical_location_required',
      sql.raw(
        "operation_mode = 'online' OR (location IS NOT NULL AND length(trim(location)) >= 2)",
      ),
    ),
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
