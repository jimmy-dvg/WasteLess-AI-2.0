import { faker } from "@faker-js/faker";
import { db } from "./db";
import * as schema from "../schema/tables";
import { deterministicId, generateHouseholdName, roles } from "./helpers";
import { SEED_USERS } from "./users.seed";

export const SEED_HOUSEHOLDS = [
  {
    id: deterministicId("household:johnson-family"),
    name: "Johnson Family",
    slug: "johnson-family",
    timezone: "America/New_York",
  },
  {
    id: deterministicId("household:smith-home"),
    name: "Smith Home",
    slug: "smith-home",
    timezone: "America/Los_Angeles",
  },
  {
    id: deterministicId("household:williams-kitchen"),
    name: "Williams Kitchen",
    slug: "williams-kitchen",
    timezone: "America/Chicago",
  },
];

export async function seedHouseholds() {
  console.log("🌱 Seeding households...");

  const householdsData = SEED_HOUSEHOLDS.map((household) => ({
    ...household,
    settings: JSON.stringify({
      currency: "USD",
      language: "en",
      theme: "light",
      notifications: {
        expiration_reminders: true,
        shopping_reminders: true,
      },
    }),
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  }));

  try {
    await db.insert(schema.households).values(householdsData).onConflictDoNothing();
    console.log(`✅ Seeded ${householdsData.length} households`);
  } catch (error) {
    console.error("❌ Error seeding households:", error);
    throw error;
  }
}

export async function seedHouseholdMembers() {
  console.log("🌱 Seeding household members...");

  const membersData = [
    // Johnson Family
    {
      id: deterministicId("member:alice-johnson"),
      household_id: SEED_HOUSEHOLDS[0].id,
      user_id: SEED_USERS[0].id, // Alice
      role: "owner",
      joined_at: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000), // ~2 years ago
    },
    {
      id: deterministicId("member:bob-johnson"),
      household_id: SEED_HOUSEHOLDS[0].id,
      user_id: SEED_USERS[1].id, // Bob
      role: "member",
      joined_at: new Date(Date.now() - 545 * 24 * 60 * 60 * 1000), // ~1.5 years ago
    },
    // Smith Home
    {
      id: deterministicId("member:carol-smith"),
      household_id: SEED_HOUSEHOLDS[1].id,
      user_id: SEED_USERS[2].id, // Carol
      role: "owner",
      joined_at: new Date(Date.now() - 545 * 24 * 60 * 60 * 1000), // ~1.5 years ago
    },
    // Williams Kitchen
    {
      id: deterministicId("member:diana-williams"),
      household_id: SEED_HOUSEHOLDS[2].id,
      user_id: SEED_USERS[3].id, // Diana
      role: "owner",
      joined_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // ~1 year ago
    },
    {
      id: deterministicId("member:alice-williams"),
      household_id: SEED_HOUSEHOLDS[2].id,
      user_id: SEED_USERS[0].id, // Alice
      role: "member",
      joined_at: new Date(Date.now() - 2190 * 24 * 60 * 60 * 1000), // ~6 years ago
    },
  ];

  const membersWithTimestamps = membersData.map((member) => ({
    ...member,
    last_active_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    created_at: member.joined_at,
    updated_at: new Date(),
  }));

  try {
    await db
      .insert(schema.household_members)
      .values(membersWithTimestamps)
      .onConflictDoNothing();
    console.log(`✅ Seeded ${membersWithTimestamps.length} household members`);
  } catch (error) {
    console.error("❌ Error seeding household members:", error);
    throw error;
  }
}




