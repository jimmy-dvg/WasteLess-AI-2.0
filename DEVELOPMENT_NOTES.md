# Development Notes

## Architectural Decisions

- The web app is the source of truth for API routes, authentication, database access, and AI services.
- The mobile app consumes the web API rather than duplicating server logic.
- Drizzle schema and migrations live in the web workspace because the Next.js app owns the database boundary.
- Cookie-based JWT auth is used for the web app; sensitive checks must remain server-side.
- Feature folders own their UI, actions, services, constants, and validation where practical.
- AI provider logic is centralized under `src/ai` so UI components can rely on stable services and fallback behavior.

## Areas to Change Carefully

- `wasteless-ai-web/src/lib/jwt*` and auth cookie helpers
- `wasteless-ai-web/middleware.ts`
- Drizzle schema and historical migrations
- Household role checks in `src/features/household`
- Inventory, scanning, recipe, and shopping API contracts used by mobile
- AI provider configuration and fallback behavior
- Environment validation under `src/env`

## Known Limitations

- Production deployment URL and Expo publishing details are not yet documented as live endpoints.
- Dependency audit issues are noted in `QA_REPORT.md`; automatic forced fixes may introduce breaking changes.
- Monitoring is mostly platform-log based until observability is added.
- Some production smoke tests are still manual.
- `wasteless-ai-shared` is reserved but currently empty.

## Current TODOs

- Add confirmed production and preview URLs after deployment.
- Resolve dependency audit findings through planned upgrades.
- Expand authenticated Playwright coverage for inventory, scanning, recipes, and shopping.
- Add a repeatable production smoke-test checklist or script.
- Decide when to extract stable web/mobile contracts into `wasteless-ai-shared`.
- Consider a future schema migration to align the `inventory_items.location` default with the English storage labels.

## Cleanup Candidates Kept Intentionally

- `wasteless-ai-shared` and mobile Metro watch-folder wiring: kept because the monorepo is already shaped for shared web/mobile code, even though the package is currently empty.
- Web dependencies that look tooling-adjacent, such as duplicate `@faker-js/faker` placement and `ts-node`: kept to avoid dependency churn without a dedicated package audit and lockfile update.
- Expo dependencies that are config or platform adjacent but not directly imported everywhere, such as `expo-font`, `expo-linking`, `expo-system-ui`, and `expo-web-browser`: kept for manual mobile review.
- Bulgarian words inside AI parsing and assistant matching rules: kept intentionally because they help recognize Bulgarian product names and user commands. The cleanup migration targets stored UI taxonomy labels, not recognition keywords.
- `WEBSITE_STRUCTURE.md`: kept as marketing-site reference material, but it should be refreshed if the marketing route group changes again.

## Cleanup Completed in This Pass

- Removed starter Next.js public SVG assets that were not referenced by the app.
- Removed Expo starter React logo assets and reset script.
- Removed a generated seed error log.
- Removed unused `React` imports now that the app uses the automatic JSX runtime.
- Stopped ignoring `package-lock.json` in the root `.gitignore`.
- Removed a missing Open Graph image reference from web metadata.
- Added a data-only migration to normalize older Bulgarian and mojibake category/storage labels to the current English UI taxonomy.
