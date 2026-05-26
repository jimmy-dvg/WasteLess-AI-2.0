# WasteLessAI Web

This workspace contains the production-facing Next.js App Router application for WasteLessAI. It owns the web UI, API routes, authentication, Neon PostgreSQL access, Drizzle schema, migrations, seed scripts, and AI-backed scanning/recipe workflows.

## Quick Start

```bash
npm install
cp wasteless-ai-web/.env.example wasteless-ai-web/.env
npm -w wasteless-ai-web run db:migrate
npm -w wasteless-ai-web run dev
```

Set at least `DATABASE_URL` and `JWT_SECRET` before running database-backed routes.

## Main Scripts

- `npm run dev` - start Next.js locally
- `npm run typecheck` - run TypeScript checks
- `npm run lint` - run ESLint
- `npm run test` - run Vitest
- `npm run build` - create a production build
- `npm run db:generate` - generate Drizzle migrations after schema changes
- `npm run db:migrate` - apply migrations
- `npm run db:studio` - open Drizzle Studio
- `npm run db:seed` - seed development data

## App Areas

- `src/app` - App Router pages, layouts, loading/error states, and API routes
- `src/features` - feature-owned UI, actions, services, constants, and validations
- `src/db` - Drizzle schema, relations, queries, and seed helpers
- `src/ai` - provider gateway, prompts, parsers, retry/cache utilities
- `src/ai-parsing` - receipt and image parsing logic
- `src/scanning` - scanner workflow types, services, and UI panels
- `src/validation` - Zod schemas shared by routes and actions

## Database

Drizzle migrations live in `drizzle/`. Do not delete historical migrations. Confirm `DATABASE_URL` before running:

```bash
npm run db:migrate
```

The current taxonomy cleanup migration normalizes older Bulgarian category/storage labels to the English UI labels.

## Deployment

Use `DEPLOYMENT_CHECKLIST.md` before production deployment. Production needs a Neon database, a strong `JWT_SECRET`, and hosted AI provider credentials for AI workflows.
