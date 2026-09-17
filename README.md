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

## Checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm run build
```
