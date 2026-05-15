# WasteLessAI Database Seed System

A production-quality, modular seed system for local development and testing of the WasteLessAI database.

## Overview

The seed system generates realistic household inventory management data across multiple households, including:

- **4 test users** with different roles and households
- **3 households** with multiple members
- **60+ products** across 6 categories (dairy, produce, meat, pantry, frozen, beverages)
- **60-75 inventory items** per household (realistic kitchen contents)
- **Shopping lists** with items and tracking
- **Recipes** with ingredients and AI-generation metadata
- **Notifications** for expiration reminders and suggestions
- **Waste logs** for tracking disposed items
- **AI generations** for recipe and recommendation examples

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Seed

Populate the database with realistic test data:

```bash
npm run db:seed
```

### Reset Database

Clear all data and re-seed:

```bash
npm run db:seed:reset
```

### Clean Database (without re-seeding)

```bash
npm run db:seed:clean
```

## Seed Data Details

### Test Users

- **Alice Johnson** (alice@example.com) - Owner of Johnson Family & Williams Kitchen
- **Bob Smith** (bob@example.com) - Member of Johnson Family
- **Carol Williams** (carol@example.com) - Owner of Smith Home
- **Diana Brown** (diana@example.com) - Owner of Williams Kitchen

### Households

1. **Johnson Family** (US Eastern Time)
   - Alice (owner), Bob (member)

2. **Smith Home** (US Pacific Time)
   - Carol (owner)

3. **Williams Kitchen** (US Central Time)
   - Diana (owner), Alice (member)

### Product Categories & Examples

- **Dairy**: Milk, yogurt, cheese, butter, cottage cheese
- **Produce**: Bananas, apples, carrots, broccoli, tomatoes, lettuce
- **Meat & Protein**: Chicken breast, ground beef, salmon, turkey, eggs, bacon
- **Pantry**: Rice, pasta, flour, olive oil, canned tomatoes, peanut butter
- **Frozen**: Broccoli, mixed vegetables, strawberries, pizza, ice cream
- **Beverages**: Orange juice, coffee, tea, sparkling water, wine

### Inventory Attributes

Each inventory item includes:

- **Location**: pantry, fridge, freezer
- **Expiration dates**: Mix of expired (-30 days), expiring soon (1-7 days), and future dates
- **Quantity & units**: Realistic amounts (g, ml, pieces, cups, etc.)
- **Purchase date**: Recent (1-14 days ago)
- **Status**: Open/unopened items
- **Metadata**: Price paid, original quantity, source

### Shopping Lists

- 2-3 lists per household
- 5-15 items per list
- Mix of checked/unchecked items
- Realistic product combinations

### Recipes

- 3-5 recipes per household
- AI-generated and user-created variants
- 3-8 ingredients per recipe
- Tags: quick, easy, healthy, vegan, dairy-free, etc.
- Realistic prep/cook times

### Waste Logs

- 10-20 waste entries per household
- Reasons: expired, spoiled, unused, cooked too much
- Optional notes and images
- Distributed across past year

### Notifications

- 5-10 notifications per household
- Types: expiration reminders, shopping reminders, AI suggestions
- Status mix: pending, sent, read

### AI Generations

- 5-8 per household
- Types: recipe generation, shopping lists, suggestions, analytics
- Models: GPT-4, GPT-3.5-turbo, Claude 3
- Token counts and costs tracked

## Modular Architecture

### Seed Files

```
src/db/seed/
├── index.ts              # Main orchestrator
├── reset.ts              # Database cleanup
├── db.ts                 # Database connection
├── helpers.ts            # Utilities and data generators
├── users.seed.ts         # User seeding
├── households.seed.ts    # Household & member seeding
├── categories.seed.ts    # Categories & products seeding
├── inventory.seed.ts     # Inventory items seeding
├── shopping.seed.ts      # Shopping lists seeding
├── recipes.seed.ts       # Recipes seeding
└── events.seed.ts        # Notifications, waste logs, AI generations
```

### Key Files

#### helpers.ts

Provides:

- **Deterministic UUIDs**: `deterministicId()` for reproducible seeding
- **Product definitions**: Realistic food/grocery items organized by category
- **Data generators**: Functions for expiration dates, household names, recipes, waste reasons
- **Constants**: Storage locations, units, roles, notification types

#### db.ts

- Pool connection management
- Drizzle ORM client setup
- Proper database connection handling

#### index.ts

- Orchestrates seed execution in correct dependency order
- Proper error handling
- Cleanup and connection closing

#### reset.ts

- Truncates tables in reverse dependency order
- Uses CASCADE to handle foreign keys
- Safe cleanup without database recreation

## Usage Examples

### Run Full Seed

```bash
npm run db:seed
```

### Reset & Re-seed (for testing)

```bash
npm run db:seed:reset
```

### Clean Only

```bash
npm run db:seed:clean
```

## Design Principles

### 1. Deterministic Seeding

UUIDs are generated from known seeds, so re-running the seed produces the same data:

```typescript
deterministicId("user:alice@example.com") // Always produces same UUID
```

### 2. Realistic Data

- Food products from popular brands
- Believable expiration dates (mix of expired, expiring, fresh)
- Realistic household structures
- Authentic waste reasons and frequencies

### 3. Relational Validity

- All foreign keys properly linked
- Inventory tied to households
- Recipes reference seeded products
- Waste logs reference inventory items

### 4. Modular Organization

- One seed file per entity type
- Easy to modify individual seeders
- Helpers centralized for reuse
- Clear dependency order

### 5. Batch Processing

Large datasets inserted in 50-item batches to optimize performance:

```typescript
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await db.insert(schema.table).values(batch).onConflictDoNothing();
}
```

### 6. Error Handling

- Try-catch blocks on all inserts
- Meaningful error messages
- Safe cleanup with `onConflictDoNothing()`

## Customization

### Add More Products

Edit `src/db/seed/helpers.ts`:

```typescript
export const productDefinitions = {
  dairy: [
    // Add new products
  ],
  // Add new categories
};
```

### Adjust Data Volumes

In entity seed files, modify counts:

```typescript
// More inventory items per household
const itemsPerHousehold = faker.number.int({ min: 25, max: 50 });
```

### Change Expiration Date Distribution

In `helpers.ts`:

```typescript
export function generateExpirationDate(): Date {
  // Adjust min/max for different distribution
  const daysFromNow = faker.number.int({ min: -60, max: 30 });
  // ...
}
```

## Performance

- **Seed time**: ~5-10 seconds for full database
- **Total records**: ~2,500+ across all tables
- **Batch size**: 50 items (optimized for most databases)
- **Connection**: Neon PostgreSQL with connection pooling

## Development Tips

### Monitor Seed Execution

The seed system logs progress with emojis:

```
🚀 Starting WasteLessAI database seed...
🌱 Seeding users...
✅ Seeded 4 users
...
✨ Database seed completed successfully!
```

### Debug Specific Seeders

Run seed files individually by modifying `src/db/seed/index.ts`:

```typescript
async function main() {
  // Temporarily comment out seeders to debug specific ones
  await seedUsers(); // Debug this
  // await seedHouseholds(); // Skip
  // ...
}
```

### Verify Data

Use a DB client (e.g., DBeaver, pgAdmin):

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM inventory_items;
SELECT * FROM households;
```

### Re-seed Specific Tables

Clear and re-seed individual tables:

```bash
npm run db:seed:clean && npm run db:seed
```

## Dependencies

- **drizzle-orm**: ^0.45.2 - Database ORM
- **faker**: ^7.6.0 - Realistic data generation
- **pg**: ^8.11.0 - PostgreSQL client
- **tsx**: ^4.17.0 - TypeScript executor
- **@neondatabase/serverless**: ^1.1.0 - Neon PostgreSQL driver

## Troubleshooting

### "DATABASE_URL is not defined"

Ensure `.env` file exists with:

```
DATABASE_URL=postgresql://user:password@host/database
```

### "Connection refused"

Check that:
- Database is running
- CONNECTION_STRING is correct
- Network access is allowed

### Foreign key constraint violations

Seed runs in dependency order. If errors occur:

```bash
npm run db:seed:clean  # Reset completely
npm run db:seed        # Re-seed from scratch
```

### Duplicate key errors

`onConflictDoNothing()` handles duplicates. If issues persist:

```bash
npm run db:seed:reset  # Full reset with CASCADE
```

## Future Enhancements

- [ ] Batch seed with different scales (small, medium, large)
- [ ] Parameterized seed with CLI options
- [ ] Household-specific seed variations
- [ ] Performance profiling and optimization
- [ ] Export seed data to JSON fixtures
- [ ] GraphQL seed introspection

## Support

For issues or questions about the seed system:

1. Check this README
2. Review seed file comments
3. Check database logs
4. Verify DATABASE_URL connection
