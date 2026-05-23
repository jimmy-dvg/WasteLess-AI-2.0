const SHELF_LIFE_RULES = [
  { pattern: /milk|yogurt|cream|kefir|dairy|мляко|йогурт|сирене|кашкавал/i, days: 10, storageLocation: "хладилник", category: "млечни" },
  { pattern: /cheese|butter|масло/i, days: 21, storageLocation: "хладилник", category: "млечни" },
  { pattern: /chicken|turkey|poultry|пиле|пуйка/i, days: 2, storageLocation: "хладилник", category: "месо" },
  { pattern: /beef|pork|steak|bacon|sausage|телеш|свин|бекон|наденица/i, days: 4, storageLocation: "хладилник", category: "месо" },
  { pattern: /fish|salmon|tuna|shrimp|seafood|риба|сьомга|тон|скариди/i, days: 2, storageLocation: "хладилник", category: "месо" },
  { pattern: /lettuce|spinach|arugula|greens|herbs|салата|спанак|рукола/i, days: 5, storageLocation: "хладилник", category: "зеленчуци" },
  { pattern: /carrot|potato|onion|tomato|avocado|морков|картоф|лук|домат|авокадо/i, days: 14, storageLocation: "хладилник", category: "зеленчуци" },
  { pattern: /apple|orange|lemon|lime|banana|berry|berries|grape|ябъл|портокал|лимон|банан|ягод|грозде/i, days: 7, storageLocation: "хладилник", category: "плодове" },
  { pattern: /bread|bagel|bun|tortilla|bakery|хляб|тортила/i, days: 5, storageLocation: "шкаф", category: "зърнени" },
  { pattern: /cereal|rice|pasta|flour|sugar|oats|granola|ориз|паста|брашно|овес/i, days: 180, storageLocation: "шкаф", category: "зърнени" },
  { pattern: /can|canned|beans|soup|sauce|tomato paste|консерв|буркан|боб|супа/i, days: 365, storageLocation: "килер", category: "консерви" },
  { pattern: /frozen|ice cream|pizza|замраз|сладолед/i, days: 120, storageLocation: "фризер", category: "замразени" },
  { pattern: /juice|soda|water|drink|beverage|сок|вода|напит/i, days: 120, storageLocation: "килер", category: "напитки" },
  { pattern: /spice|salt|pepper|herb|подправ|сол|пипер|риган/i, days: 365, storageLocation: "шкаф", category: "подправки" },
  { pattern: /snack|chips|cracker|cookie|chocolate/i, days: 90, storageLocation: "шкаф", category: "зърнени" },
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
    storageLocation: "килер",
    category: category || "зърнени",
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
