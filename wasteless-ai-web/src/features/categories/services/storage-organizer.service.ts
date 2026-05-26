import "server-only";

import { z } from "zod";
import { aiGateway } from "@/ai/gateway";
import {
  CATEGORY_NAMES,
  STORAGE_ZONE_VALUES,
  type RecommendedCategoryName,
  type StorageZoneName,
} from "@/features/categories/constants";

const aiSuggestionSchema = z.object({
  category: z.enum(CATEGORY_NAMES),
  storageZone: z.enum(STORAGE_ZONE_VALUES),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(240),
});

export type ProductStorageSuggestion = {
  productName: string;
  category: RecommendedCategoryName;
  storageZone: StorageZoneName;
  confidence: number;
  reason: string;
  source: "ai" | "fallback";
};

type OrganizerRule = {
  pattern: RegExp;
  category: RecommendedCategoryName;
  storageZone: StorageZoneName;
  confidence: number;
  reason: string;
};

const ORGANIZER_RULES: OrganizerRule[] = [
  {
    pattern: /замраз|frozen|ice cream|сладолед|freezer/i,
    category: "Frozen",
    storageZone: "Freezer",
    confidence: 0.92,
    reason: "Frozen products should stay in the freezer to preserve texture and safety.",
  },
  {
    pattern: /кисело мляко|мляко|йогурт|yogurt|milk|cheese|сирене|кашкавал|cream|butter|масло|dairy/i,
    category: "Dairy & eggs",
    storageZone: "Fridge",
    confidence: 0.9,
    reason: "Dairy products are best kept chilled.",
  },
  {
    pattern: /пиле|chicken|beef|pork|свин|телеш|кайма|месо|риба|fish|salmon|tuna|shrimp|sausage|bacon|steak/i,
    category: "Meat & seafood",
    storageZone: "Fridge",
    confidence: 0.88,
    reason: "Fresh meat and fish need cold storage and should be used quickly.",
  },
  {
    pattern: /egg|eggs|яйце|яйца/i,
    category: "Dairy & eggs",
    storageZone: "Fridge",
    confidence: 0.84,
    reason: "Eggs are stored with chilled dairy staples in most household inventories.",
  },
  {
    pattern: /green beans|bell pepper|pepper|broccoli|romanesco|corn|cucumber|radish|cabbage|bok choy|carrot|tomato|avocado|spinach|lettuce|sauerkraut|kimchi|beans?|чушка|броколи|царевица|крастав|репич|зеле/i,
    category: "Vegetables",
    storageZone: "Fridge",
    confidence: 0.84,
    reason: "Fresh vegetables and fermented vegetable products are best grouped as vegetables.",
  },
  {
    pattern: /wheat berries|chia seeds|pistachios|nuts|dark chocolate|chocolate/i,
    category: "Grains & bakery",
    storageZone: "Cupboard",
    confidence: 0.84,
    reason: "Dry seeds, nuts, and pantry snacks belong with shelf-stable staples.",
  },
  {
    pattern: /kumquat|peach|mango|grapefruit|strawberry|strawberries|apple|apples|orange|banana|berry|berries|grape|прасков|манго|грейпфрут|ягод/i,
    category: "Fruit",
    storageZone: "Fridge",
    confidence: 0.84,
    reason: "Fruit lasts longer when it is tracked together and kept cool after purchase.",
  },
  {
    pattern: /ориз|rice|pasta|паста|спагети|oats|овес|flour|брашно|cereal|булгур|киноа|bread|хляб|wheat berries|chia seeds|pistachios|nuts|dark chocolate|chocolate/i,
    category: "Grains & bakery",
    storageZone: "Cupboard",
    confidence: 0.86,
    reason: "Dry grains and bakery staples usually belong in a cupboard.",
  },
  {
    pattern: /консерва|консерв|canned|can\b|beans|боб|леща|soup|tomato paste|лютеница|буркан|jar/i,
    category: "Canned & jars",
    storageZone: "Pantry",
    confidence: 0.84,
    reason: "Canned and jarred products are shelf-stable in a dry storage zone.",
  },
  {
    pattern: /подправ|salt|сол|pepper|пипер|cinnamon|канела|oregano|риган|paprika|червен пипер|spice|herb/i,
    category: "Spices & herbs",
    storageZone: "Cupboard",
    confidence: 0.86,
    reason: "Spices keep well in a closed cupboard away from heat and moisture.",
  },
  {
    pattern: /вода|water|juice|сок|soda|cola|чай|tea|coffee|кафе|drink|beverage|напит/i,
    category: "Drinks",
    storageZone: "Pantry",
    confidence: 0.78,
    reason: "Shelf-stable drinks can stay in pantry storage until opened.",
  },
  {
    pattern: /ябъл|apple|банан|banana|портокал|orange|лимон|lemon|ягод|berry|berries|грозде|grape|плод/i,
    category: "Fruit",
    storageZone: "Fridge",
    confidence: 0.76,
    reason: "Most fruit lasts longer in cool storage after purchase.",
  },
  {
    pattern: /домат|tomato|крастав|cucumber|морков|carrot|картоф|potato|лук|onion|салата|lettuce|spinach|спанак|грах|peas|зеленч/i,
    category: "Vegetables",
    storageZone: "Fridge",
    confidence: 0.76,
    reason: "Fresh vegetables usually keep better in the fridge.",
  },
];

export function suggestProductStorageFallback(productName: string, existingCategory?: string | null): ProductStorageSuggestion {
  const haystack = `${productName} ${existingCategory ?? ""}`;
  const rule = ORGANIZER_RULES.find((entry) => entry.pattern.test(haystack));

  if (rule) {
    return {
      productName,
      category: rule.category,
      storageZone: rule.storageZone,
      confidence: rule.confidence,
      reason: rule.reason,
      source: "fallback",
    };
  }

  return {
    productName,
    category: "Vegetables",
    storageZone: "Other",
    confidence: 0.45,
    reason: "No exact match was found, so this should be reviewed before saving.",
    source: "fallback",
  };
}

export async function suggestProductStorage(
  productName: string,
  options: { userId?: string } = {}
): Promise<ProductStorageSuggestion> {
  const normalizedName = productName.trim();
  const fallback = suggestProductStorageFallback(normalizedName);

  try {
    const response = await aiGateway.generateJSON(
      {
        userId: options.userId,
        temperature: 0.1,
        maxTokens: 180,
        messages: [
          {
            role: "system",
            content: [
              "You are WasteLessAI's household inventory organizer.",
              `Choose exactly one category from: ${CATEGORY_NAMES.join(", ")}.`,
              `Choose exactly one storage zone from: ${STORAGE_ZONE_VALUES.join(", ")}.`,
              "Use practical food safety. Dairy and fresh meat usually need Fridge. Frozen products need Freezer. Dry grains, spices, and canned goods usually go to Cupboard or Pantry.",
              "Return a short reason in English.",
            ].join(" "),
          },
          {
            role: "user",
            content: `Suggest the best category and storage zone for this product: ${normalizedName}`,
          },
        ],
      },
      aiSuggestionSchema
    );

    return {
      productName: normalizedName,
      category: response.outputJson.category,
      storageZone: response.outputJson.storageZone,
      confidence: response.outputJson.confidence,
      reason: response.outputJson.reason,
      source: "ai",
    };
  } catch {
    return fallback;
  }
}
