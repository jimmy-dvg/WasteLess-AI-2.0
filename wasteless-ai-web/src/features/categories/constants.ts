export const CATEGORY_NAMES = [
  "Fruit",
  "Vegetables",
  "Meat & seafood",
  "Dairy & eggs",
  "Grains & bakery",
  "Spices & herbs",
  "Drinks",
  "Frozen",
  "Canned & jars",
] as const;

export const STORAGE_ZONE_VALUES = ["Fridge", "Freezer", "Pantry", "Cupboard", "Other"] as const;

export type RecommendedCategoryName = (typeof CATEGORY_NAMES)[number];
export type StorageZoneName = (typeof STORAGE_ZONE_VALUES)[number];

export const RECOMMENDED_CATEGORIES: {
  name: RecommendedCategoryName;
  color: string;
  swatchClass: string;
  description: string;
}[] = [
  { name: "Fruit", color: "#f97316", swatchClass: "bg-orange-500", description: "Fresh, dried, and preserved fruit." },
  { name: "Vegetables", color: "#22c55e", swatchClass: "bg-green-500", description: "Fresh produce, herbs, roots, and salad items." },
  { name: "Meat & seafood", color: "#ef4444", swatchClass: "bg-red-500", description: "Meat, poultry, fish, and protein products." },
  { name: "Dairy & eggs", color: "#38bdf8", swatchClass: "bg-sky-400", description: "Milk, yogurt, cheese, eggs, butter, and cream." },
  { name: "Grains & bakery", color: "#eab308", swatchClass: "bg-yellow-500", description: "Rice, pasta, oats, flour, cereal, and bread staples." },
  { name: "Spices & herbs", color: "#a855f7", swatchClass: "bg-purple-500", description: "Spices, seasoning blends, salt, pepper, and dried herbs." },
  { name: "Drinks", color: "#06b6d4", swatchClass: "bg-cyan-500", description: "Water, juice, soda, tea, coffee, and other drinks." },
  { name: "Frozen", color: "#60a5fa", swatchClass: "bg-blue-400", description: "Frozen vegetables, fruit, meals, desserts, and ice." },
  { name: "Canned & jars", color: "#64748b", swatchClass: "bg-slate-500", description: "Canned goods, jars, preserved sauces, and shelf-stable tins." },
];

export const STORAGE_ZONES: {
  name: StorageZoneName;
  description: string;
}[] = [
  { name: "Fridge", description: "Cold storage for dairy, opened food, meat, and delicate produce." },
  { name: "Freezer", description: "Frozen products and long-term frozen portions." },
  { name: "Pantry", description: "Dry, dark storage for shelf-stable products." },
  { name: "Cupboard", description: "Everyday dry goods, spices, grains, and canned food." },
  { name: "Other", description: "Anything that does not fit the main household zones." },
];

export const STORAGE_ORGANIZER_EXAMPLES = [
  { product: "Greek yogurt", category: "Dairy & eggs", storageZone: "Fridge" },
  { product: "Rice", category: "Grains & bakery", storageZone: "Cupboard" },
  { product: "Frozen peas", category: "Frozen", storageZone: "Freezer" },
] as const;

export const LEGACY_STORAGE_OPTIONS = ["pantry", "fridge", "freezer", "counter", "cellar", "other"] as const;

export const STORAGE_LOCATION_OPTIONS = [...STORAGE_ZONE_VALUES, ...LEGACY_STORAGE_OPTIONS] as const;

const LEGACY_STORAGE_ZONE_MAP: Record<string, StorageZoneName> = {
  fridge: "Fridge",
  freezer: "Freezer",
  pantry: "Pantry",
  cupboard: "Cupboard",
  cellar: "Pantry",
  counter: "Other",
  other: "Other",
  "хладилник": "Fridge",
  "фризер": "Freezer",
  "килер": "Pantry",
  "шкаф": "Cupboard",
  "друго": "Other",
};

export function normalizeTaxonomyName(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function normalizeStorageZone(value: string | null | undefined): StorageZoneName | string {
  if (!value) return "Pantry";
  const normalized = normalizeTaxonomyName(value);
  return LEGACY_STORAGE_ZONE_MAP[normalized] ?? normalized;
}
