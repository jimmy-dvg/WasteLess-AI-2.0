export const CATEGORY_NAMES = [
  "плодове",
  "зеленчуци",
  "месо",
  "млечни",
  "зърнени",
  "подправки",
  "напитки",
  "замразени",
  "консерви",
] as const;

export const STORAGE_ZONE_VALUES = ["хладилник", "фризер", "килер", "шкаф", "друго"] as const;

export type RecommendedCategoryName = (typeof CATEGORY_NAMES)[number];
export type StorageZoneName = (typeof STORAGE_ZONE_VALUES)[number];

export const RECOMMENDED_CATEGORIES: {
  name: RecommendedCategoryName;
  color: string;
  swatchClass: string;
  description: string;
}[] = [
  { name: "плодове", color: "#f97316", swatchClass: "bg-orange-500", description: "Fresh, dried, and preserved fruit." },
  { name: "зеленчуци", color: "#22c55e", swatchClass: "bg-green-500", description: "Fresh produce, herbs, roots, and salad items." },
  { name: "месо", color: "#ef4444", swatchClass: "bg-red-500", description: "Meat, poultry, fish, and protein products." },
  { name: "млечни", color: "#38bdf8", swatchClass: "bg-sky-400", description: "Milk, yogurt, cheese, butter, and cream." },
  { name: "зърнени", color: "#eab308", swatchClass: "bg-yellow-500", description: "Rice, pasta, oats, flour, cereal, and bread staples." },
  { name: "подправки", color: "#a855f7", swatchClass: "bg-purple-500", description: "Spices, seasoning blends, salt, pepper, and dried herbs." },
  { name: "напитки", color: "#06b6d4", swatchClass: "bg-cyan-500", description: "Water, juice, soda, tea, coffee, and other drinks." },
  { name: "замразени", color: "#60a5fa", swatchClass: "bg-blue-400", description: "Frozen vegetables, fruit, meals, desserts, and ice." },
  { name: "консерви", color: "#64748b", swatchClass: "bg-slate-500", description: "Canned goods, jars, preserved sauces, and shelf-stable tins." },
];

export const STORAGE_ZONES: {
  name: StorageZoneName;
  description: string;
}[] = [
  { name: "хладилник", description: "Cold storage for dairy, opened food, meat, and delicate produce." },
  { name: "фризер", description: "Frozen products and long-term frozen portions." },
  { name: "килер", description: "Dry, dark storage for shelf-stable products." },
  { name: "шкаф", description: "Everyday dry goods, spices, grains, and canned food." },
  { name: "друго", description: "Anything that does not fit the main household zones." },
];

export const STORAGE_ORGANIZER_EXAMPLES = [
  { product: "Кисело мляко", category: "млечни", storageZone: "хладилник" },
  { product: "Ориз", category: "зърнени", storageZone: "шкаф" },
  { product: "Замразен грах", category: "замразени", storageZone: "фризер" },
] as const;

export const LEGACY_STORAGE_OPTIONS = ["pantry", "fridge", "freezer", "counter", "cellar", "other"] as const;

export const STORAGE_LOCATION_OPTIONS = [...STORAGE_ZONE_VALUES, ...LEGACY_STORAGE_OPTIONS] as const;

const LEGACY_STORAGE_ZONE_MAP: Record<string, StorageZoneName> = {
  fridge: "хладилник",
  freezer: "фризер",
  pantry: "килер",
  cellar: "килер",
  counter: "друго",
  other: "друго",
};

export function normalizeTaxonomyName(value: string) {
  return value.trim().toLocaleLowerCase("bg-BG");
}

export function normalizeStorageZone(value: string | null | undefined): StorageZoneName | string {
  if (!value) return "килер";
  const normalized = normalizeTaxonomyName(value);
  return LEGACY_STORAGE_ZONE_MAP[normalized] ?? normalized;
}
