const SHELF_LIFE_RULES = [
  { pattern: /milk|yogurt|cream|kefir|dairy/i, days: 10, storageLocation: "fridge", category: "Dairy" },
  { pattern: /cheese|butter/i, days: 21, storageLocation: "fridge", category: "Dairy" },
  { pattern: /chicken|turkey|poultry/i, days: 2, storageLocation: "fridge", category: "Meat" },
  { pattern: /beef|pork|steak|bacon|sausage/i, days: 4, storageLocation: "fridge", category: "Meat" },
  { pattern: /fish|salmon|tuna|shrimp|seafood/i, days: 2, storageLocation: "fridge", category: "Seafood" },
  { pattern: /lettuce|spinach|arugula|greens|herbs/i, days: 5, storageLocation: "fridge", category: "Produce" },
  { pattern: /apple|orange|lemon|lime|carrot|potato|onion/i, days: 21, storageLocation: "pantry", category: "Produce" },
  { pattern: /banana|berry|berries|grape|tomato|avocado/i, days: 5, storageLocation: "counter", category: "Produce" },
  { pattern: /bread|bagel|bun|tortilla|bakery/i, days: 5, storageLocation: "pantry", category: "Bakery" },
  { pattern: /cereal|rice|pasta|flour|sugar|oats|granola/i, days: 180, storageLocation: "pantry", category: "Dry Goods" },
  { pattern: /can|canned|beans|soup|sauce|tomato paste/i, days: 365, storageLocation: "pantry", category: "Canned Goods" },
  { pattern: /frozen|ice cream|pizza/i, days: 120, storageLocation: "freezer", category: "Frozen" },
  { pattern: /juice|soda|water|drink|beverage/i, days: 120, storageLocation: "pantry", category: "Beverages" },
  { pattern: /snack|chips|cracker|cookie|chocolate/i, days: 90, storageLocation: "pantry", category: "Snacks" },
];

export type ShelfLifeEstimate = {
  shelfLifeDays: number;
  storageLocation: string;
  category: string;
};

export function estimateShelfLife(name: string, category?: string | null): ShelfLifeEstimate {
  const haystack = `${name} ${category ?? ""}`;
  const rule = SHELF_LIFE_RULES.find((entry) => entry.pattern.test(haystack));

  if (rule) {
    return {
      shelfLifeDays: rule.days,
      storageLocation: rule.storageLocation,
      category: category || rule.category,
    };
  }

  return {
    shelfLifeDays: 14,
    storageLocation: "pantry",
    category: category || "Grocery",
  };
}

export function addDaysToDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
