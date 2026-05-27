# WasteLessAI Production Deployment Checklist

Use this checklist before deploying the Next.js web app to Vercel.

## Required Environment Variables

Server-only required variables:

- `DATABASE_URL` - Neon PostgreSQL pooled connection string.
- `JWT_SECRET` - strong JWT signing secret; use at least 32 characters in production.

Recommended production variables:

- `APP_URL` - canonical app URL, for example `https://your-app.vercel.app`.
- `API_CORS_ORIGIN` - only set when a separate client origin must call `/api/*`.
- `NOTIFICATIONS_CRON_SECRET` or `CRON_SECRET` - required if `/api/notifications/run` is triggered by a scheduler.

AI and scanner variables:

- Configure at least one hosted AI provider for production: `OPENAI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, or `TOGETHER_API_KEY`.
- Photo recognition requires `OPENAI_API_KEY` or `GEMINI_API_KEY`.
- Optional barcode providers: `USDA_FDC_API_KEY`, `BARCODE_LOOKUP_API_KEY`.
- Optional image persistence: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_RECEIPT_FOLDER`.

Client-safe variables:

- `NEXT_PUBLIC_APP_URL` may be set only if client code needs the public URL. Do not put secrets in `NEXT_PUBLIC_*`.

## Local Verification Commands

Run from `wasteless-ai-web`:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run db:generate
```

Do not run production migrations against the wrong database. Confirm `DATABASE_URL` before any migration command.

## Database Migration Steps

1. Confirm the production Neon database and pooled `DATABASE_URL`.
2. Generate migrations locally when schema changes:

   ```bash
   npm run db:generate
   ```

3. Review generated SQL under `drizzle/`.
4. Apply migrations to the target database:

   ```bash
   npm run db:migrate
   ```

5. Optional local inspection:

   ```bash
   npm run db:studio
   ```

Never reset, drop, or seed production data unless a separate, explicit recovery plan exists.

After applying migrations, verify that taxonomy data uses the current English UI labels:

- Category names should match `Fruit`, `Vegetables`, `Meat & seafood`, `Dairy & eggs`, `Grains & bakery`, `Spices & herbs`, `Drinks`, `Frozen`, and `Canned & jars`.
- Storage labels should match `Fridge`, `Freezer`, `Pantry`, `Cupboard`, or `Other`.
- Migration `0011_english_taxonomy_cleanup.sql` is data-only and normalizes older Bulgarian/mojibake labels where present.

## Vercel Deployment Steps

1. Create or select the Vercel project for `wasteless-ai-web`.
2. Set the project root to `wasteless-ai-web`.
3. Configure all required production environment variables in Vercel.
4. Use `npm run build` as the build command.
5. Deploy a preview branch first.
6. Run migrations against the production Neon database after review.
7. Promote the deployment to production.
8. Confirm HTTPS is active so secure auth cookies are sent.

## Production Smoke Tests

Public:

- Home page loads.
- Register page loads.
- Login page loads.

Auth:

- User can register.
- User can log in.
- User can log out.
- Protected pages redirect to `/login` when logged out.
- Auth cookies are `httpOnly`, `secure` in production, `sameSite=lax`, path `/`, and expire as expected.

Dashboard:

- Dashboard loads for a logged-in user.
- Empty states render correctly.

Inventory:

- Add item.
- Edit item.
- Delete item.
- Expired and expiring statuses display correctly.

AI Scanner:

- Upload/select image.
- Invalid image input returns a safe error.
- Successful AI response renders reviewable items.
- Provider failure returns a safe fallback/error without stack traces or secrets.

Recipe Assistant:

- Generate recipes from inventory.
- Empty inventory is handled.
- AI failure uses fallback behavior safely.

Shopping List:

- Generated list loads.
- Manual item can be checked/unchecked when supported.
- Empty state works.

Database:

- Migrations run successfully.
- App connects to the Neon production database.
- User data is isolated between accounts.
- Existing category and storage labels display in English.

Deployment:

- Production build passes.
- Environment variables are configured.
- Auth cookies work over HTTPS.
- API routes work after deployment.

## Security Checklist

- `.env` and `.env.local` are ignored by git.
- `.env.example` contains no real secrets.
- Server secrets are not exposed as `NEXT_PUBLIC_*`.
- `JWT_SECRET` is validated centrally and shared by signing and verification.
- User-owned inventory, recipe, shopping, scanning, and waste resources are scoped by authenticated user or household.
- API errors do not return stack traces or secret values in production.
- AI prompts and private user data are not logged in full request logs.

## Rollback Notes

- Keep the previous Vercel deployment available for instant rollback.
- Do not roll back database migrations automatically unless the migration has a tested down plan.
- If a deploy fails after a migration, prefer a forward fix migration or route-level mitigation.
- Rotate `JWT_SECRET` only with a session invalidation plan.

## Known Limitations / TODOs

- Production smoke tests are manual until broader Playwright coverage is added.
- Monitoring is currently limited to platform logs and safe `console.error` route logging.
- Cloudinary, barcode provider keys, and cron secrets are optional unless those workflows are enabled in production.
