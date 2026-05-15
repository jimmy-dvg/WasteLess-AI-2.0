import { faker } from "@faker-js/faker";
import { db } from "./db";
import * as schema from "../schema/tables";
import { deterministicId } from "./helpers";

export const SEED_USERS = [
  {
    id: deterministicId("user:alice@example.com"),
    email: "alice@example.com",
    name: "Alice Johnson",
    preferred_locale: "en",
  },
  {
    id: deterministicId("user:bob@example.com"),
    email: "bob@example.com",
    name: "Bob Smith",
    preferred_locale: "en",
  },
  {
    id: deterministicId("user:carol@example.com"),
    email: "carol@example.com",
    name: "Carol Williams",
    preferred_locale: "en",
  },
  {
    id: deterministicId("user:diana@example.com"),
    email: "diana@example.com",
    name: "Diana Brown",
    preferred_locale: "en",
  },
];

export async function seedUsers() {
  console.log("🌱 Seeding users...");

  const usersData = SEED_USERS.map((user) => ({
    ...user,
    email_verified_at: new Date().toISOString(),
    avatar_url: faker.image.avatar(),
    password_hash: null,
    meta: JSON.stringify({
      preferences: {
        notifications_enabled: true,
        email_digest: "daily",
      },
    }),
    created_at: new Date(),
    updated_at: new Date(),
  }));

  try {
    await db.insert(schema.users).values(usersData).onConflictDoNothing();
    console.log(`✅ Seeded ${usersData.length} users`);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}



