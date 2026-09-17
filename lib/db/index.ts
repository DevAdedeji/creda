import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is required. Copy .env.example to .env.')

const pooled = /-pooler\./i.test(url) || /pgbouncer=true/i.test(url)
export const client = postgres(url, {
  max: 10,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 30 * 60,
  // Neon's transaction pooler cannot retain prepared statements.
  prepare: !pooled,
  connection: {
    application_name: 'creda',
    statement_timeout: 15_000,
    lock_timeout: 5_000,
    idle_in_transaction_session_timeout: 15_000,
  },
})

export const db = drizzle(client, { schema, casing: 'snake_case' })
