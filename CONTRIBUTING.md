# Contributing

## Local Setup

1. Install Node.js 20+.
2. Run `npm install` from the repository root.
3. Copy `wasteless-ai-web/.env.example` to `wasteless-ai-web/.env`.
4. Set `DATABASE_URL` and `JWT_SECRET`.
5. Run `npm -w wasteless-ai-web run db:migrate`.
6. Start development with `npm run dev` or a single workspace command.

## Branching and Commits

Use short, descriptive branches:

- `feature/<name>`
- `fix/<name>`
- `refactor/<name>`

Use conventional commit style:

```text
feat(inventory): add expiry filter
fix(auth): handle invalid login payload
docs(deploy): clarify Neon migration steps
```

## Code Style

- Prefer simple, readable TypeScript.
- Keep components focused on one responsibility.
- Use Server Components by default in the web app.
- Use Client Components only for interactivity.
- Keep database access in query/service modules.
- Validate route/action input before using it.
- Keep AI prompts and provider logic out of UI components.
- Reuse existing UI and helper patterns before adding new abstractions.

## Safe Cleanup and Refactor Rules

- Search for references before deleting files.
- Treat App Router files, layouts, loading/error/not-found files, middleware, config, migrations, and env examples as conventionally used unless proven otherwise.
- Do not remove validation, authorization, error handling, or security checks.
- Keep behavior, API contracts, database schema, auth behavior, and AI provider behavior stable unless the task explicitly requires a change.
- Document uncertain cleanup candidates instead of deleting them.

## Testing Expectations

Run the checks that match the change:

```bash
npm -w wasteless-ai-web run typecheck
npm -w wasteless-ai-web run lint
npm -w wasteless-ai-web run test
npm -w wasteless-ai-web run build
npm -w wasteless-ai-mobile run lint
npm -w wasteless-ai-mobile run test
```

For high-risk web changes, run:

```bash
npm -w wasteless-ai-web run test:e2e
```

Critical flows to protect:

- Authentication
- Inventory CRUD and expiry status
- Scanner import confirmation
- Recipe generation and fallback behavior
- Shopping list updates
- Household authorization
- Notification checks

## Pull Request Checklist

- Code is scoped to the stated problem.
- No secrets or real environment values are committed.
- Validation and authorization remain server-side.
- Migrations are reviewed and target the correct database.
- UI has loading, empty, and error states where relevant.
- Relevant tests or manual verification are documented.
- Cleanup candidates with uncertain usage are listed instead of removed.
