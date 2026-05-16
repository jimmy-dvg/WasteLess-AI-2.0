import { db } from "./db";
import * as schema from "../schema/tables";
import {
  deterministicId,
  generateRecipeTitle,
  generateRecipeInstructions,
  units,
  getAllProducts,
  randomInt,
  randomElement,
  randomFloat,
} from "./helpers";
import { SEED_HOUSEHOLDS } from "./households.seed";
import { SEED_USERS } from "./users.seed";

type SeedRecipe = {
  id: string;
  created_at: Date;
};

type SeedProduct = {
  name: string;
};

export async function seedRecipes() {
  console.log("🌱 Seeding recipes...");

  const recipes = [];
  const products = getAllProducts();

  // Create 3-5 recipes per household
  for (const household of SEED_HOUSEHOLDS) {
    const recipesCount = randomInt(3, 5);

    for (let i = 0; i < recipesCount; i++) {
      recipes.push({
        id: deterministicId(`recipe:${household.id}:${i}`),
        household_id: household.id,
        created_by: SEED_USERS[0].id,
        title: generateRecipeTitle(),
        description: "Sample recipe description",
        servings: randomInt(2, 8),
        cook_time: randomInt(15, 120),
        ingredients: JSON.stringify(
          Array.from({ length: randomInt(3, 8) }).map(() => ({
            name: randomElement(products).name,
            quantity: randomFloat(0.5, 5, 1).toString(),
            unit: randomElement(units),
          }))
        ),
        instructions: generateRecipeInstructions(),
        tags: JSON.stringify(
          Array.from({ length: randomInt(1, 3) }).map(() =>
            randomElement([
              "quick",
              "easy",
              "healthy",
              "vegan",
              "dairy-free",
              "gluten-free",
              "comfort-food",
            ])
          )
        ),
        metadata: JSON.stringify({
          source: randomElement(["user_created", "ai_generated", "imported"]),
          difficulty: randomElement(["easy", "medium", "hard"]),
          cuisine: randomElement([
            "italian",
            "asian",
            "american",
            "mexican",
            "mediterranean",
          ]),
          dietary_tags: ["vegetarian"],
        }),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      });
    }
  }

  try {
    await db.insert(schema.recipes).values(recipes).onConflictDoNothing();
    console.log(`✅ Seeded ${recipes.length} recipes`);
  } catch (error) {
    console.error("❌ Error seeding recipes:", error);
    throw error;
  }

  // Seed recipe ingredients
  await seedRecipeIngredients(recipes, products);
}

export async function seedRecipeIngredients(recipes: SeedRecipe[], products: SeedProduct[]) {
  console.log("🌱 Seeding recipe ingredients...");

  const recipeIngredients = [];

  for (const recipe of recipes) {
    const ingredientsCount = randomInt(3, 8);

    for (let i = 0; i < ingredientsCount; i++) {
      const product = randomElement(products);

      recipeIngredients.push({
        id: deterministicId(`recipe_ingredient:${recipe.id}:${i}`),
        recipe_id: recipe.id,
        product_id: deterministicId(`product:${product.name}`),
        ingredient_text: `${randomFloat(0.5, 5, 1)} ${randomElement(units)} ${product.name}`,
        quantity: randomFloat(0.5, 5, 1).toString(),
        unit: randomElement(units),
        order: i,
        created_at: recipe.created_at,
        updated_at: new Date(),
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < recipeIngredients.length; i += batchSize) {
      const batch = recipeIngredients.slice(i, i + batchSize);
      await db
        .insert(schema.recipe_ingredients)
        .values(batch)
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${recipeIngredients.length} recipe ingredients`);
  } catch (error) {
    console.error("❌ Error seeding recipe ingredients:", error);
    throw error;
  }
}




