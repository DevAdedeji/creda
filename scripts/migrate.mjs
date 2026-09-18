import { existsSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

if (!process.env.DIRECT_URL && !process.env.DATABASE_URL && existsSync('.env')) {
  process.loadEnvFile()
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required. Copy .env.example to .env.')
  process.exit(1)
}

const client = postgres(url, { max: 1, onnotice: () => {} })
try {
  await migrate(drizzle(client), { migrationsFolder: './drizzle' })
  console.log('Creda migrations applied')
} catch (error) {
  console.error('Creda migration failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await client.end()
}
