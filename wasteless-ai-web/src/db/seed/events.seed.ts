import { db } from "./db";
import * as schema from "../schema/tables";
import {
  deterministicId,
  generateNotificationPayload,
  generateWasteReason,
  generateAIPrompt,
  generateAIResult,
  generateAIMetadata,
  randomInt,
  randomElement,
  randomBoolean,
  randomFloat,
} from "./helpers";
import { SEED_HOUSEHOLDS } from "./households.seed";
import { SEED_USERS } from "./users.seed";

export async function seedNotifications() {
  console.log("🌱 Seeding notifications...");

  const notifications = [];
  const types = [
    "expiration_reminder",
    "shopping_reminder",
    "system",
    "ai_suggestion",
  ];

  for (const household of SEED_HOUSEHOLDS) {
    const notificationsCount = randomInt(5, 10);

    for (let i = 0; i < notificationsCount; i++) {
      const type = randomElement(types);
      const user = randomElement(SEED_USERS);

      notifications.push({
        id: deterministicId(`notification:${household.id}:${i}`),
        user_id: user.id,
        household_id: household.id,
        type: type,
        payload: JSON.stringify(
          generateNotificationPayload(type, "Product Name", 3)
        ),
        status: randomElement(["pending", "sent", "read"]),
        scheduled_at: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        sent_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        read_at: randomBoolean(0.6) ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await db
        .insert(schema.notifications)
        .values(batch)
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${notifications.length} notifications`);
  } catch (error) {
    console.error("❌ Error seeding notifications:", error);
    throw error;
  }
}

export async function seedWasteLogs() {
  console.log("🌱 Seeding waste logs...");

  const wasteLogs = [];

  for (const household of SEED_HOUSEHOLDS) {
    const wasteLogsCount = randomInt(10, 20);

    for (let i = 0; i < wasteLogsCount; i++) {
      wasteLogs.push({
        id: deterministicId(`waste_log:${household.id}:${i}`),
        household_id: household.id,
        user_id: randomElement(SEED_USERS).id,
        inventory_item_id: randomBoolean(0.7)
          ? deterministicId(`inventory:${household.id}:product:${i}`)
          : null,
        product_id: null,
        quantity: randomFloat(0.5, 3, 1),
        unit: randomElement(["g", "ml", "piece", "cup"]),
        reason: generateWasteReason(),
        notes: randomBoolean(0.5) ? "Sample waste note" : null,
        image_url: randomBoolean(0.2) ? "https://via.placeholder.com/300" : null,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < wasteLogs.length; i += batchSize) {
      const batch = wasteLogs.slice(i, i + batchSize);
      await db
        .insert(schema.waste_logs)
        .values(batch)
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${wasteLogs.length} waste logs`);
  } catch (error) {
    console.error("❌ Error seeding waste logs:", error);
    throw error;
  }
}

export async function seedAIGenerations() {
  console.log("🌱 Seeding AI generations...");

  const aiGenerations = [];
  const types = ["recipe", "shopping_list", "suggestion", "analytics"];

  for (const household of SEED_HOUSEHOLDS) {
    const aiCount = randomInt(5, 8);

    for (let i = 0; i < aiCount; i++) {
      const type = randomElement(types);

      aiGenerations.push({
        id: deterministicId(`ai_generation:${household.id}:${i}`),
        user_id: randomElement(SEED_USERS).id,
        household_id: household.id,
        generation_type: type,
        prompt: JSON.stringify(generateAIPrompt(type)),
        result: JSON.stringify(generateAIResult(type)),
        model: randomElement(["gpt-4", "gpt-3.5-turbo", "claude-3"]),
        tokens: randomInt(100, 2000),
        cost: randomFloat(0.001, 0.1, 3),
        status: randomElement([
          "completed",
          "pending",
          "failed",
        ]),
        metadata: JSON.stringify(
          generateAIMetadata()
        ),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < aiGenerations.length; i += batchSize) {
      const batch = aiGenerations.slice(i, i + batchSize);
      await db
        .insert(schema.ai_generations)
        .values(batch)
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${aiGenerations.length} AI generations`);
  } catch (error) {
    console.error("❌ Error seeding AI generations:", error);
    throw error;
  }
}
