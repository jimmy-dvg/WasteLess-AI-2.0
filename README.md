# WasteLessAI

WasteLessAI is an AI-assisted household inventory platform that helps people reduce food and product waste. It combines inventory tracking, expiration reminders, recipe suggestions, scanning workflows, shopping lists, and household collaboration.

The main problem it solves: households often lose track of what they already own, what expires soon, and what can be cooked before it becomes waste. WasteLessAI keeps that information visible and actionable.

## Core Features

- Cookie-based user authentication with JWT sessions and bcrypt password hashing
- Dashboard for inventory, expiry, waste, shopping, recipes, scanning, and household workflows
- Pantry, fridge, freezer, and household product inventory management
- Expiration tracking and notification reminders
- AI receipt, product photo, and barcode-assisted scanning workflows
- AI recipe recommendations using available and expiring ingredients
- Shopping list generation and manual shopping list management
- Household collaboration with roles and invitations
- Expo mobile client direction for on-the-go inventory, scanning, and notifications

## Tech Stack

- Web: Next.js App Router, React, Tailwind CSS
- Mobile: Expo, Expo Router, React Native
- Database: Neon PostgreSQL
- ORM: Drizzle ORM and drizzle-kit migrations
- Auth: Cookie-based JWT sessions, bcrypt password hashing
- Validation: Zod
- Testing: Vitest and Playwright
- AI: Configurable provider gateway plus scanner-specific OpenAI/Gemini support

## Project Structure

```text
WasteLess-AI-2.0/
  wasteless-ai-web/       Next.js web app, API routes, DB schema, migrations
  wasteless-ai-mobile/    Expo mobile client
  wasteless-ai-shared/    Reserved shared package workspace
  package.json            npm workspace scripts
```

Important web folders:

```text
wasteless-ai-web/src/
  app/                    Next.js App Router pages and route handlers
  ai/                     AI gateway, providers, prompts, parsers, services
  ai-parsing/             Receipt and product photo parsing
  db/                     Drizzle schema, queries, seed scripts
  features/               Feature modules for auth, inventory, recipes, etc.
  services/               Shared server services
  validation/             Zod schemas
```

## Environment Variables

Create `wasteless-ai-web/.env` or `wasteless-ai-web/.env.local` from `wasteless-ai-web/.env.example`.

Required for the web app:

```env
DATABASE_URL=
JWT_SECRET=
```

Common optional values:

```env
APP_URL=http://localhost:3000
API_CORS_ORIGIN=http://localhost:8083
OPENAI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=
USDA_FDC_API_KEY=
BARCODE_LOOKUP_API_KEY=
NOTIFICATIONS_CRON_SECRET=
```

Mobile local development usually needs:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Never commit real secrets. Keep client-safe values under `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` only when they are intended to be public.

## Local Setup

Requirements:

- Node.js 20+
- npm
- A Neon PostgreSQL database or local PostgreSQL-compatible database

Install dependencies from the repository root:

```bash
npm install
```

Run both apps:

```bash
npm run dev
```

Run only the web app:

```bash
npm -w wasteless-ai-web run dev
```

Run only the mobile app:

```bash
npm -w wasteless-ai-mobile run start
```

## Database Setup

1. Create a Neon project and database.
2. Copy the pooled connection string into `wasteless-ai-web/.env` as `DATABASE_URL`.
3. Confirm the target database before running migrations.
4. Apply migrations from the web workspace:

```bash
npm -w wasteless-ai-web run db:migrate
```

Generate a migration after schema changes:

```bash
npm -w wasteless-ai-web run db:generate
```

Seed a development database only:

```bash
npm -w wasteless-ai-web run db:seed
```

Do not seed or reset production data.

## Package Scripts

Root scripts:

- `npm run dev` - run web and mobile development servers together
- `npm run build` - build the web app
- `npm run lint` - lint web and mobile workspaces
- `npm test` - run web and mobile tests
- `npm run test:coverage` - run test coverage
- `npm run test:e2e` - run web Playwright tests
- `npm run qa` - lint, test, build, and e2e checks

Web scripts:

- `npm -w wasteless-ai-web run dev`
- `npm -w wasteless-ai-web run typecheck`
- `npm -w wasteless-ai-web run lint`
- `npm -w wasteless-ai-web run test`
- `npm -w wasteless-ai-web run build`
- `npm -w wasteless-ai-web run db:migrate`
- `npm -w wasteless-ai-web run db:studio`

Mobile scripts:

- `npm -w wasteless-ai-mobile run start`
- `npm -w wasteless-ai-mobile run android`
- `npm -w wasteless-ai-mobile run ios`
- `npm -w wasteless-ai-mobile run web`
- `npm -w wasteless-ai-mobile run lint`
- `npm -w wasteless-ai-mobile run test`

## Authentication Overview

The web app uses server-side authentication with bcrypt password hashes and signed JWT session cookies. API routes and server actions validate the current user on the server. Sensitive routes should never rely on client-only checks.

Session and auth utilities live under `wasteless-ai-web/src/lib`, `wasteless-ai-web/src/features/auth`, and `wasteless-ai-web/src/actions`.

## AI Features Overview

AI logic is intentionally separated from UI components:

- `src/ai/gateway` routes requests across configured providers.
- `src/ai/providers` contains provider adapters.
- `src/ai/prompts` keeps prompts centralized.
- `src/ai-parsing` handles receipt and photo parsing.
- `src/features/categories/services` handles category and storage suggestions.

Hosted providers should be used in production. Local providers such as Ollama are useful for development but are not suitable for Vercel production unless separately hosted.

## Deployment Notes

The web app is the production deployment target. See `wasteless-ai-web/DEPLOYMENT_CHECKLIST.md` before deploying.

Minimum production checklist:

- Set `DATABASE_URL` and `JWT_SECRET`.
- Configure at least one hosted AI provider if AI features are enabled.
- Run `npm -w wasteless-ai-web run typecheck`, `lint`, `test`, and `build`.
- Review and apply Drizzle migrations to the correct Neon database.
- Verify auth cookies over HTTPS.
- Smoke test dashboard, inventory, scanner, recipes, shopping list, and notifications.

## Troubleshooting

- Missing env variable: compare your local env file with `wasteless-ai-web/.env.example`.
- Database connection failure: confirm the Neon pooled connection string and SSL settings.
- Auth loops or missing session: confirm `JWT_SECRET`, HTTPS in production, and cookie settings.
- Mobile cannot reach API: set `EXPO_PUBLIC_API_URL` to the web dev server URL.
- AI requests fail: verify provider API keys and `AI_PROVIDER` / `AI_PROVIDER_CHAIN`.
- Stale build behavior: remove `.next` and run the web dev server again.

## Related Docs

- `PROJECT_OVERVIEW.md`
- `CONTRIBUTING.md`
- `DEVELOPMENT_NOTES.md`
- `QA_REPORT.md`
- `wasteless-ai-web/DEPLOYMENT_CHECKLIST.md`
