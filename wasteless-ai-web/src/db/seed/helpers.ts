import crypto from "crypto";

/**
 * Generate deterministic UUIDs for consistent seeding
 */
export function deterministicId(seed: string): string {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is one of 8, 9, A, or B
  const version = "4";
  const variant = (parseInt(hash.substring(16, 18), 16) & 0x3 | 0x8).toString(16);
  
  return [
    hash.substring(0, 8),           // 8 chars
    hash.substring(8, 12),          // 4 chars
    version + hash.substring(13, 16), // 4 chars (version prefix)
    variant + hash.substring(17, 20), // 4 chars (variant prefix)
    hash.substring(20, 32),         // 12 chars
  ].join("-");
}

/**
 * Generate random integer between min and max
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max with precision
 */
export function randomFloat(min: number, max: number, precision = 2): number {
  const random = Math.random() * (max - min) + min;
  return Math.round(random * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Generate random boolean with optional probability
 */
export function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Pick random element from array
 */
export function randomElement<T>(array: T[] | readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Product definitions organized by category
 */
export const productDefinitions = {
  dairy: [
    { name: "Organic Milk 2%", brand: "Horizon", unit: "ml", serving: "240" },
    { name: "Greek Yogurt Plain", brand: "Fage", unit: "g", serving: "170" },
    { name: "Cheddar Cheese Block", brand: "Cabot", unit: "g", serving: "28" },
    { name: "Mozzarella String Cheese", brand: "Kraft", unit: "g", serving: "28" },
    { name: "Cottage Cheese", brand: "Good Culture", unit: "g", serving: "113" },
    { name: "Butter Unsalted", brand: "Kerrygold", unit: "g", serving: "14" },
    { name: "Sour Cream", brand: "Daisy", unit: "g", serving: "30" },
  ],
  produce: [
    { name: "Bananas", brand: "Fresh", unit: "piece", serving: "118" },
    { name: "Apples Gala", brand: "Honeycrisp", unit: "piece", serving: "182" },
    { name: "Carrots Organic", brand: "Fresh", unit: "g", serving: "61" },
    { name: "Broccoli Crown", brand: "Fresh", unit: "g", serving: "91" },
    { name: "Tomatoes Heirloom", brand: "Fresh", unit: "piece", serving: "149" },
    { name: "Lettuce Romaine", brand: "Fresh", unit: "g", serving: "47" },
    { name: "Bell Peppers Red", brand: "Fresh", unit: "piece", serving: "119" },
    { name: "Onion Yellow", brand: "Fresh", unit: "piece", serving: "150" },
    { name: "Garlic Bulb", brand: "Fresh", unit: "clove", serving: "3" },
    { name: "Potatoes Yukon Gold", brand: "Fresh", unit: "piece", serving: "173" },
  ],
  meat: [
    { name: "Chicken Breast Boneless", brand: "Perdue", unit: "g", serving: "100" },
    { name: "Ground Beef 85/15", brand: "Angus", unit: "g", serving: "100" },
    { name: "Salmon Fillet", brand: "Wild Alaska", unit: "g", serving: "100" },
    { name: "Turkey Sliced", brand: "Applegate", unit: "g", serving: "56" },
    { name: "Eggs Large Brown", brand: "Vital Farms", unit: "piece", serving: "50" },
    { name: "Bacon Maple", brand: "Hormel", unit: "g", serving: "14" },
  ],
  pantry: [
    { name: "Brown Rice", brand: "Uncle Ben", unit: "g", serving: "45" },
    { name: "Pasta Penne", brand: "Barilla", unit: "g", serving: "56" },
    { name: "All Purpose Flour", brand: "King Arthur", unit: "g", serving: "30" },
    { name: "Extra Virgin Olive Oil", brand: "California Olive Ranch", unit: "ml", serving: "15" },
    { name: "Canned Tomatoes Diced", brand: "San Marzano", unit: "g", serving: "250" },
    { name: "Canned Black Beans", brand: "Bush", unit: "g", serving: "120" },
    { name: "Peanut Butter Natural", brand: "Skippy", unit: "g", serving: "32" },
    { name: "Honey Raw", brand: "Really Raw", unit: "ml", serving: "21" },
    { name: "Oats Rolled", brand: "Bob's Red Mill", unit: "g", serving: "40" },
    { name: "Cereal Granola", brand: "Nature Valley", unit: "g", serving: "45" },
    { name: "Bread Whole Wheat", brand: "Dave's", unit: "slice", serving: "43" },
  ],
  frozen: [
    { name: "Frozen Broccoli Florets", brand: "Bird's Eye", unit: "g", serving: "85" },
    { name: "Frozen Mixed Vegetables", brand: "Cascadian Farm", unit: "g", serving: "85" },
    { name: "Frozen Strawberries", brand: "Driscoll", unit: "g", serving: "144" },
    { name: "Frozen Pizza Pepperoni", brand: "DiGiorno", unit: "g", serving: "140" },
    { name: "Ice Cream Vanilla", brand: "Ben & Jerry", unit: "g", serving: "65" },
  ],
  beverages: [
    { name: "Orange Juice", brand: "Simply Orange", unit: "ml", serving: "240" },
    { name: "Coffee Whole Bean", brand: "Lavazza", unit: "g", serving: "10" },
    { name: "Green Tea Bags", brand: "Twinings", unit: "piece", serving: "2" },
    { name: "Sparkling Water", brand: "LaCroix", unit: "ml", serving: "355" },
    { name: "Red Wine", brand: "Yellow Tail", unit: "ml", serving: "150" },
  ],
};

/**
 * Generate realistic household names
 */
export function generateHouseholdName(): string {
  const surnames = ["Johnson", "Smith", "Williams", "Brown", "Jones"];
  const suffixes = ["Family", "Household", "Home"];
  
  return `${randomElement(surnames)} ${randomElement(suffixes)}`;
}

/**
 * Generate realistic shopping list names
 */
export function generateShoppingListName(): string {
  const types = [
    "Weekly Groceries",
    "Dinner Party",
    "Meal Prep",
    "Stock Up",
    "Quick Trip",
    "Pantry Staples",
    "Farmer's Market",
    "Bulk Buy",
  ];
  return randomElement(types);
}

/**
 * Generate realistic recipe titles
 */
export function generateRecipeTitle(): string {
  const dishes = [
    "Grilled Chicken with Roasted Vegetables",
    "Homemade Pasta Carbonara",
    "Buddha Bowl with Quinoa and Tahini",
    "Beef Stir Fry with Brown Rice",
    "Baked Salmon with Lemon Asparagus",
    "Vegetable Soup",
    "Chicken Stir Fry",
    "Pasta Primavera",
    "Grilled Cheese Sandwich",
    "Salad with Homemade Dressing",
    "Smoothie Bowl",
    "Roasted Root Vegetables",
    "Caprese Salad",
    "Tomato Basil Pasta",
    "Sheet Pan Dinner",
  ];
  return randomElement(dishes);
}

/**
 * Generate realistic recipe instructions
 */
export function generateRecipeInstructions(): string {
  return `
1. Preheat oven to 425°F (220°C).
2. Prepare ingredients and season to taste.
3. Arrange on baking sheet or in cooking vessel.
4. Cook for 20-30 minutes until done.
5. Let rest for 5 minutes before serving.
6. Garnish and enjoy!
  `.trim();
}

/**
 * Generate realistic waste reasons
 */
export function generateWasteReason(): string {
  const reasons = [
    "expired",
    "spoiled",
    "unused",
    "cooked_too_much",
    "not_edible",
    "forgotten",
  ];
  return randomElement(reasons);
}

/**
 * Generate realistic notification payloads
 */
export function generateNotificationPayload(
  type: string,
  itemName: string,
  daysUntilExpiry?: number
) {
  const payloads: Record<string, object> = {
    expiration_reminder: {
      item: itemName,
      days_until_expiry: daysUntilExpiry || 2,
      action: "mark_used_or_waste",
    },
    shopping_reminder: {
      list_name: "Weekly Groceries",
      items_count: randomInt(5, 15),
    },
    ai_suggestion: {
      suggestion_type: "recipe",
      based_on: "expiring items",
      confidence: 0.85,
    },
  };

  return payloads[type] || { message: "Notification" };
}

/**
 * Generate realistic AI generation prompts
 */
export function generateAIPrompt(type: string): object {
  const prompts: Record<string, object> = {
    recipe: {
      type: "recipe_generation",
      ingredients: "chicken, rice, vegetables",
      dietary_restrictions: ["none"],
      prep_time_max: 30,
    },
    shopping_list: {
      type: "smart_shopping",
      expiring_soon: 3,
      empty_categories: ["dairy", "proteins"],
    },
    suggestion: {
      type: "waste_reduction",
      recent_waste: ["expired items", "spoilage"],
    },
  };

  return prompts[type] || { type: "general" };
}

/**
 * Generate realistic AI generation results
 */
export function generateAIResult(type: string): object {
  const results: Record<string, object> = {
    recipe: {
      recipe_id: "auto-generated",
      title: generateRecipeTitle(),
      servings: 4,
      prep_time: randomInt(10, 45),
      cook_time: randomInt(15, 60),
      difficulty: "medium",
    },
    shopping_list: {
      list_id: "auto-generated",
      items: randomInt(5, 15),
      estimated_cost: randomFloat(30, 150, 2),
    },
    suggestion: {
      type: "use_soon",
      items: 3,
      confidence_score: 0.92,
    },
  };

  return results[type] || { status: "completed" };
}

/**
 * Storage locations for inventory items
 */
export const locations = ["pantry", "fridge", "freezer"] as const;

/**
 * Product units
 */
export const units = [
  "g",
  "kg",
  "ml",
  "l",
  "oz",
  "lb",
  "cup",
  "tbsp",
  "tsp",
  "piece",
  "slice",
] as const;

/**
 * Household roles
 */
export const roles = ["owner", "admin", "member"] as const;

/**
 * Generate expiration date: varies between -30 days (expired) to +90 days (future)
 */
export function generateExpirationDate(): Date {
  const daysFromNow = Math.floor(Math.random() * 120) - 30; // -30 to +90
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Generate purchase date: recent (last 2 weeks)
 */
export function generatePurchaseDate(): Date {
  const daysAgo = Math.floor(Math.random() * 14) + 1; // 1 to 14 days ago
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Generate realistic AI generation metadata
 */
export function generateAIMetadata() {
  return {
    model: randomElement(["gpt-4", "gpt-3.5-turbo", "claude-3"]),
    temperature: randomFloat(0, 1, 2),
    max_tokens: randomInt(500, 2000),
  };
}

/**
 * Flatten product definitions for easier iteration
 */
export function getAllProducts(): typeof productDefinitions.dairy {
  return [
    ...productDefinitions.dairy,
    ...productDefinitions.produce,
    ...productDefinitions.meat,
    ...productDefinitions.pantry,
    ...productDefinitions.frozen,
    ...productDefinitions.beverages,
  ];
}

