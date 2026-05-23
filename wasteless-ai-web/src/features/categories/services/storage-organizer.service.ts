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
    category: "замразени",
    storageZone: "фризер",
    confidence: 0.92,
    reason: "Frozen products should stay in the freezer to preserve texture and safety.",
  },
  {
    pattern: /кисело мляко|мляко|йогурт|yogurt|milk|cheese|сирене|кашкавал|cream|butter|масло|dairy/i,
    category: "млечни",
    storageZone: "хладилник",
    confidence: 0.9,
    reason: "Dairy products are best kept chilled.",
  },
  {
    pattern: /пиле|chicken|beef|pork|свин|телеш|кайма|месо|риба|fish|salmon|tuna|shrimp|sausage|bacon|steak/i,
    category: "месо",
    storageZone: "хладилник",
    confidence: 0.88,
    reason: "Fresh meat and fish need cold storage and should be used quickly.",
  },
  {
    pattern: /ориз|rice|pasta|паста|спагети|oats|овес|flour|брашно|cereal|булгур|киноа|bread|хляб/i,
    category: "зърнени",
    storageZone: "шкаф",
    confidence: 0.86,
    reason: "Dry grains and bakery staples usually belong in a cupboard.",
  },
  {
    pattern: /консерва|консерв|canned|can\b|beans|боб|леща|soup|tomato paste|лютеница|буркан|jar/i,
    category: "консерви",
    storageZone: "килер",
    confidence: 0.84,
    reason: "Canned and jarred products are shelf-stable in a dry storage zone.",
  },
  {
    pattern: /подправ|salt|сол|pepper|пипер|cinnamon|канела|oregano|риган|paprika|червен пипер|spice|herb/i,
    category: "подправки",
    storageZone: "шкаф",
    confidence: 0.86,
    reason: "Spices keep well in a closed cupboard away from heat and moisture.",
  },
  {
    pattern: /вода|water|juice|сок|soda|cola|чай|tea|coffee|кафе|drink|beverage|напит/i,
    category: "напитки",
    storageZone: "килер",
    confidence: 0.78,
    reason: "Shelf-stable drinks can stay in pantry storage until opened.",
  },
  {
    pattern: /ябъл|apple|банан|banana|портокал|orange|лимон|lemon|ягод|berry|berries|грозде|grape|плод/i,
    category: "плодове",
    storageZone: "хладилник",
    confidence: 0.76,
    reason: "Most fruit lasts longer in cool storage after purchase.",
  },
  {
    pattern: /домат|tomato|крастав|cucumber|морков|carrot|картоф|potato|лук|onion|салата|lettuce|spinach|спанак|грах|peas|зеленч/i,
    category: "зеленчуци",
    storageZone: "хладилник",
    confidence: 0.76,
    reason: "Fresh vegetables usually keep better in the fridge.",
  },
];

function fallbackSuggestion(productName: string): ProductStorageSuggestion {
  const rule = ORGANIZER_RULES.find((entry) => entry.pattern.test(productName));

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
    category: "зеленчуци",
    storageZone: "друго",
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
  const fallback = fallbackSuggestion(normalizedName);

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
              "Use practical food safety. Dairy and fresh meat usually need хладилник. Frozen products need фризер. Dry grains, spices, and canned goods usually go to шкаф or килер.",
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
