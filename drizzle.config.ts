import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

if (existsSync('.env')) process.loadEnvFile()

// Use a direct connection for DDL when DATABASE_URL points at a pooler.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is required. Copy .env.example to .env.')

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: { url },
})
