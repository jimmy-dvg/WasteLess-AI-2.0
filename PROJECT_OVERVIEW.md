# Project Overview

## Product Vision

WasteLessAI is a practical household assistant for reducing food and product waste. The product should help users know what they own, what expires soon, what they can cook now, and what they should or should not buy next.

## Main User Flows

- Register or log in with an email/password account.
- Review dashboard summaries for inventory, expiry, recipes, shopping, and waste.
- Add, edit, filter, and delete inventory products.
- Scan receipts, product photos, shelf photos, fridge photos, and barcodes.
- Confirm scanned items before importing them into inventory.
- Generate recipes from available and expiring inventory.
- Save recipes, plan meals, and add missing items to the shopping list.
- Manage shopping list items manually or from generated suggestions.
- Configure household settings, invite members, and manage roles.
- Review notifications and expiry reminders.

## Main Modules

- Auth: registration, login, logout, session cookies, user lookup.
- Dashboard: summaries, navigation, notification entry points.
- Inventory: product CRUD, filters, categories, storage zones, expiry status.
- Categories: recommended taxonomy, category manager, storage suggestions.
- Scanning: OCR, photo recognition, barcode lookup, scan history, import batches.
- Recipes: recipe generation, saved recipes, recipe details, shopping integration.
- Meal planning: smart meal plans and optimized shopping suggestions.
- Shopping: shopping lists and item state.
- Household: household ownership, roles, invitations, settings, activity.
- Notifications: expiry checks, preferences, push token registration.
- AI gateway: provider selection, retry, fallback, prompts, and parsing.

## Architecture Overview

The web app is a Next.js App Router application. Server Components are preferred for page-level data loading, and Client Components are used for interactive controls. API routes and server actions perform validation, authorization, and service calls.

Database access is centralized behind Drizzle schema, query, and service modules. UI components should not talk directly to the database.

The mobile app is an Expo client that consumes the web API surface. It keeps mobile-specific presentation and storage concerns separate from server-owned business rules.

## Data Ownership Model

User-owned and household-owned records must be scoped server-side. Inventory, recipes, shopping lists, scanning history, waste logs, and notification resources should only be accessible to authorized users or household members.

Household roles are intentionally conservative:

- `owner` controls household ownership and critical settings.
- `admin` can manage shared household workflows.
- `member` can contribute to inventory, shopping, and meal planning.
- `guest` has limited visibility and should not mutate core household data.

## Security Notes

- Passwords are hashed with bcrypt.
- Sessions are stored in HTTP-only cookies.
- JWT signing secrets are validated centrally.
- API routes and server actions validate input with Zod or equivalent checks.
- Secrets must never be exposed through `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`.
- Authorization must be enforced on the server for every sensitive route.
- AI errors should not expose prompts, raw private data, stack traces, or secrets.

## AI Integration Overview

AI features are service-owned rather than component-owned. Prompts, providers, model selection, parsing, fallback behavior, and retry logic are kept in `wasteless-ai-web/src/ai` and adjacent scanner/category services.

Core AI workflows:

- Product photo recognition
- Receipt OCR parsing
- Barcode enrichment fallback
- Recipe generation and inventory-aware recommendations
- Storage/category suggestions
- Assistant responses for inventory and shopping support

The app should degrade gracefully when an AI provider is unavailable.

## Future Roadmap

- Production monitoring and alerting
- More complete Playwright coverage for authenticated flows
- EAS/Expo deployment pipeline
- Barcode provider hardening and richer product matching
- Household sharing polish and audit history
- Push notification delivery hardening
- Sustainability and waste analytics
- OCR receipt history improvements
- Shared package extraction when web/mobile contracts stabilize
