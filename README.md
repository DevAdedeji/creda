# Creda

Nuxt 4 and Nuxt UI app.

## Local setup

```sh
npm install
cp .env.example .env
docker compose up -d db
npm run db:migrate
npm run dev
```

Set `BETTER_AUTH_SECRET` in `.env`. The app runs on `http://localhost:4002`; PostgreSQL runs locally on port `5444`. Local account emails print their links in the terminal.

Google location suggestions and maps are optional. To enable them, set `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env` and enable the Maps JavaScript, Places API (New), and Maps Embed APIs in a billing-enabled Google Cloud project. Restrict the key to your site and set a Places quota.

## Checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm run build
```
