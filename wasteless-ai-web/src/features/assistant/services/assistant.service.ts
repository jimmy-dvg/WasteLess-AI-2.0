import "server-only";

import { revalidatePath } from "next/cache";
import { asc, desc, eq, isNull, or, and } from "drizzle-orm";
import { aiGateway } from "@/ai/gateway";
import {
  assistantResponseJsonSchema,
  buildAssistantContextMessage,
  buildAssistantSystemPrompt,
  normalizeAssistantHistory,
  type AssistantPromptContext,
} from "@/ai/prompts/assistant";
import type { AIMessage, AIProviderId, AIUsage } from "@/ai/types";
import { getAiSettingsForUser } from "@/ai/services/ai-settings";
import { db } from "@/db";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import {
  type AssistantAiResponseInput,
  assistantAiResponseSchema,
} from "@/validation/assistant";
import { recipePreferencesSchema } from "@/validation/recipes";
import { addUniqueItemsToShoppingList } from "@/services/shopping-list.service";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  formatQuantity,
  formatRelativeExpiration,
  getExpirationStatus,
  parseJsonValue,
  toDate,
} from "@/lib/dashboard-utils";
import type {
  AssistantChatMessageInput,
  AssistantChatResponse,
  AssistantContextSummary,
  AssistantExecutedAction,
  AssistantShoppingItem,
} from "@/features/assistant/types";

type AssistantUser = {
  id: string;
  name: string;
  email: string;
};

type AssistantInventoryItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string | null;
  category: string | null;
  location: string | null;
  expirationDate: Date | null;
  status: "fresh" | "expiring" | "expired";
};

type AssistantShoppingSnapshot = {
  list: {
    id: string;
    name: string;
  } | null;
  items: Array<{
    id: string;
    name: string;
    quantity: string;
    checked: boolean;
  }>;
};

type AssistantRuntimeContext = {
  household: {
    id: string;
    name: string;
    timezone: string | null;
  };
  inventory: AssistantInventoryItem[];
  shopping: AssistantShoppingSnapshot;
  preferences: unknown;
  aiSettings: {
    provider: AIProviderId;
    model: string;
    enableStreaming: boolean;
  };
  summary: AssistantContextSummary;
};

type AssistantAiResult = {
  data: AssistantAiResponseInput;
  usage: AIUsage;
  provider: AIProviderId;
  model: string;
  latencyMs?: number;
  cost?: number | null;
};

const MAX_INVENTORY_CONTEXT_ITEMS = 80;
const MAX_SHOPPING_CONTEXT_ITEMS = 40;
const SHOPPING_ADD_VERBS_BG = ["добави", "сложи", "прибави"];
const SHOPPING_LIST_WORDS_BG = ["списък", "списъка", "листа", "пазар"];
const SHOPPING_UNIT_WORDS = new Set([
  "g",
  "kg",
  "ml",
  "l",
  "lb",
  "oz",
  "bag",
  "bags",
  "box",
  "boxes",
  "pack",
  "packs",
  "bottle",
  "bottles",
  "carton",
  "cartons",
  "can",
  "cans",
  "cup",
  "cups",
  "г",
  "кг",
  "мл",
  "л",
  "бр",
  "бр.",
  "пакет",
  "пакета",
  "кутия",
  "кутии",
  "бутилка",
  "бутилки",
  "литър",
  "литра",
]);
const GENERIC_SHOPPING_ITEM_NAMES = new Set([
  "продукти",
  "артикули",
  "липсващи продукти",
  "липсващите продукти",
  "липсващи артикули",
  "missing items",
  "missing ingredients",
  "shopping items",
  "groceries",
]);

function cleanErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "AI assistant is unavailable right now.";
}

function detectLanguage(message: string): "bg" | "en" {
  return /[а-яА-Я]/.test(message) ? "bg" : "en";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-я\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(source: string, needles: string[]) {
  return needles.some((needle) => source.includes(needle));
}

function isExplicitShoppingAdd(message: string) {
  const normalized = normalizeText(message);
  const hasBulgarianAdd =
    containsAny(normalized, SHOPPING_ADD_VERBS_BG) && containsAny(normalized, SHOPPING_LIST_WORDS_BG);
  const hasEnglishAdd = /\b(add|put)\b/.test(normalized) && /\b(shopping|grocery|list)\b/.test(normalized);

  return hasBulgarianAdd || hasEnglishAdd;
}

function dateToIso(value: unknown) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
}

function getExpirationSortValue(item: AssistantInventoryItem) {
  if (!item.expirationDate) return Number.MAX_SAFE_INTEGER;
  return item.expirationDate.getTime();
}

function getStatusWeight(status: AssistantInventoryItem["status"]) {
  if (status === "expiring") return 0;
  if (status === "expired") return 1;
  return 2;
}

function sortInventoryForAssistant(items: AssistantInventoryItem[]) {
  return [...items].sort((a, b) => {
    const statusDiff = getStatusWeight(a.status) - getStatusWeight(b.status);
    if (statusDiff !== 0) return statusDiff;
    const dateDiff = getExpirationSortValue(a) - getExpirationSortValue(b);
    if (dateDiff !== 0) return dateDiff;
    return a.name.localeCompare(b.name);
  });
}

function toPromptContext(context: AssistantRuntimeContext): AssistantPromptContext {
  return {
    current_date: new Date().toISOString().slice(0, 10),
    household: {
      name: context.household.name,
      timezone: context.household.timezone,
    },
    inventory: context.inventory.slice(0, MAX_INVENTORY_CONTEXT_ITEMS).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      location: item.location,
      expiration_date: dateToIso(item.expirationDate),
      status: item.status,
    })),
    shopping_list: {
      name: context.shopping.list?.name ?? null,
      items: context.shopping.items.slice(0, MAX_SHOPPING_CONTEXT_ITEMS).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        checked: item.checked,
      })),
    },
    recipe_preferences: context.preferences,
  };
}

function getPriorityItems(inventory: AssistantInventoryItem[]) {
  return inventory
    .filter((item) => item.status === "expiring" || item.status === "expired")
    .slice(0, 8)
    .map((item) => ({
      name: item.name,
      quantity: item.quantity,
      status: item.status,
      expirationDateLabel: item.expirationDate ? formatRelativeExpiration(item.expirationDate) : "No date set",
    }));
}

function buildContextSummary(context: Omit<AssistantRuntimeContext, "summary">): AssistantContextSummary {
  const expiringCount = context.inventory.filter((item) => item.status === "expiring").length;
  const expiredCount = context.inventory.filter((item) => item.status === "expired").length;

  return {
    householdName: context.household.name,
    inventoryCount: context.inventory.length,
    expiringCount,
    expiredCount,
    shoppingItemCount: context.shopping.items.length,
    priorityItems: getPriorityItems(context.inventory),
    aiProviderLabel: `${context.aiSettings.provider} / ${context.aiSettings.model}`,
  };
}

async function getInventorySnapshot(userId: string, householdId: string) {
  const scope = or(
    eq(schema.products.household_id, householdId),
    and(isNull(schema.products.household_id), eq(schema.products.user_id, userId))
  )!;

  const rows = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      quantity: schema.products.quantity,
      unit: schema.products.unit,
      storageLocation: schema.products.storage_location,
      expirationDate: schema.products.expiration_date,
      categoryName: schema.categories.name,
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.category_id, schema.categories.id))
    .where(scope)
    .orderBy(asc(schema.products.name))
    .limit(150);

  const items = rows.map((row) => {
    const expirationDate = toDate(row.expirationDate);
    return {
      id: row.id,
      name: row.name,
      quantity: formatQuantity(row.quantity, row.unit),
      unit: row.unit ?? null,
      category: row.categoryName ?? null,
      location: row.storageLocation ?? null,
      expirationDate,
      status: getExpirationStatus(expirationDate),
    } satisfies AssistantInventoryItem;
  });

  return sortInventoryForAssistant(items).slice(0, MAX_INVENTORY_CONTEXT_ITEMS);
}

async function getShoppingSnapshot(householdId: string): Promise<AssistantShoppingSnapshot> {
  const lists = await db
    .select({
      id: schema.shopping_lists.id,
      name: schema.shopping_lists.name,
      updatedAt: schema.shopping_lists.updated_at,
    })
    .from(schema.shopping_lists)
    .where(eq(schema.shopping_lists.household_id, householdId))
    .orderBy(desc(schema.shopping_lists.updated_at))
    .limit(1);

  const list = lists[0] ?? null;
  if (!list) {
    return {
      list: null,
      items: [],
    };
  }

  const rows = await db
    .select({
      id: schema.shopping_list_items.id,
      name: schema.shopping_list_items.name,
      quantity: schema.shopping_list_items.quantity,
      unit: schema.shopping_list_items.unit,
      checked: schema.shopping_list_items.checked,
      createdAt: schema.shopping_list_items.created_at,
    })
    .from(schema.shopping_list_items)
    .where(eq(schema.shopping_list_items.shopping_list_id, list.id))
    .orderBy(asc(schema.shopping_list_items.checked), asc(schema.shopping_list_items.created_at))
    .limit(80);

  return {
    list: {
      id: list.id,
      name: list.name,
    },
    items: rows.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: formatQuantity(item.quantity, item.unit),
      checked: Boolean(item.checked),
    })),
  };
}

async function getRecipePreferences(userId: string) {
  const rows = await db.select({ meta: schema.users.meta }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  const meta = parseJsonValue<Record<string, unknown>>(rows[0]?.meta ?? {}, {});
  const parsed = recipePreferencesSchema.safeParse(meta.preferences ?? {});
  return parsed.success ? parsed.data : recipePreferencesSchema.parse({});
}

async function getAssistantRuntimeContext(user: AssistantUser): Promise<AssistantRuntimeContext> {
  const household = await ensurePersonalHouseholdForUser(user);
  const [inventory, shopping, preferences, aiSettings] = await Promise.all([
    getInventorySnapshot(user.id, household.id),
    getShoppingSnapshot(household.id),
    getRecipePreferences(user.id),
    getAiSettingsForUser(user.id),
  ]);

  const withoutSummary = {
    household,
    inventory,
    shopping,
    preferences,
    aiSettings,
  };

  return {
    ...withoutSummary,
    summary: buildContextSummary(withoutSummary),
  };
}

async function generateAssistantAiResponse(
  messages: AssistantChatMessageInput[],
  context: AssistantRuntimeContext,
  userId: string
): Promise<AssistantAiResult> {
  const aiMessages: AIMessage[] = [
    { role: "system", content: buildAssistantSystemPrompt() },
    { role: "user", content: buildAssistantContextMessage(toPromptContext(context)) },
    ...normalizeAssistantHistory(messages),
  ];

  const response = await aiGateway.generateJSON(
    {
      messages: aiMessages,
      model: context.aiSettings.model,
      temperature: 0.25,
      maxTokens: 900,
      jsonSchema: assistantResponseJsonSchema,
      responseType: "json",
      userId,
    },
    assistantAiResponseSchema,
    { providerId: context.aiSettings.provider }
  );

  return {
    data: response.outputJson,
    usage: response.usage ?? {},
    provider: response.provider,
    model: response.model,
    latencyMs: response.latencyMs,
    cost: response.cost?.totalCost ?? null,
  };
}

function normalizeShoppingItems(items: AssistantShoppingItem[]) {
  const seen = new Set<string>();
  const normalized: AssistantShoppingItem[] = [];

  for (const item of items) {
    const name = item.name.trim().replace(/\s+/g, " ");
    const key = normalizeText(name);
    if (!key || seen.has(key) || GENERIC_SHOPPING_ITEM_NAMES.has(key)) continue;
    seen.add(key);
    normalized.push({
      name,
      quantity: item.quantity?.trim() || null,
      unit: item.unit?.trim() || null,
    });
  }

  return normalized.slice(0, 12);
}

function extractShoppingText(message: string) {
  const trimmed = message.trim().replace(/[.!?]+$/g, "");
  const patterns = [
    /(?:добави|сложи|прибави)\s+(.+?)(?:\s+(?:в|към)\s+(?:списъка|списък|листа|лист|пазара|пазаруване).*)$/i,
    /(?:add|put)\s+(.+?)(?:\s+(?:to|into)\s+(?:the\s+)?(?:shopping|grocery)?\s*list.*)$/i,
    /(?:добави|сложи|прибави)\s+(.+)$/i,
    /(?:add|put)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function parseItemSegment(segment: string): AssistantShoppingItem | null {
  const cleaned = segment
    .replace(/\b(?:please|моля)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 2) return null;

  const quantityMatch = cleaned.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (!quantityMatch) {
    return { name: cleaned, quantity: null, unit: null };
  }

  const quantity = quantityMatch[1].replace(",", ".");
  const rest = quantityMatch[2].trim();
  const parts = rest.split(/\s+/);

  if (parts.length >= 2 && SHOPPING_UNIT_WORDS.has(parts[0].toLowerCase())) {
    return {
      name: parts.slice(1).join(" "),
      quantity,
      unit: parts[0],
    };
  }

  return {
    name: rest,
    quantity,
    unit: null,
  };
}

function parseShoppingItemsFromText(message: string) {
  const itemText = extractShoppingText(message);
  if (!itemText) return [];

  const parts = itemText
    .split(/\s*(?:,|;|\+|\s+и\s+|\s+and\s+)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return normalizeShoppingItems(parts.map(parseItemSegment).filter((item): item is AssistantShoppingItem => Boolean(item)));
}

function formatShoppingItem(item: AssistantShoppingItem) {
  return [item.quantity, item.unit, item.name].filter(Boolean).join(" ");
}

function buildShoppingConfirmation(
  items: AssistantShoppingItem[],
  action: AssistantExecutedAction,
  language: "bg" | "en"
) {
  const names = items.map(formatShoppingItem).join(", ");

  if (language === "bg") {
    if (action.insertedCount === 0) {
      return `Всички тези артикули вече са в списъка за пазаруване: ${names}.`;
    }

    if (action.skippedCount > 0) {
      return `Добавих новите артикули в списъка за пазаруване: ${names}. ${action.skippedCount} вече бяха там.`;
    }

    return `Добавих в списъка за пазаруване: ${names}.`;
  }

  if (action.insertedCount === 0) {
    return `Those items are already on your shopping list: ${names}.`;
  }

  if (action.skippedCount > 0) {
    return `Added the new shopping list items: ${names}. ${action.skippedCount} were already there.`;
  }

  return `Added to your shopping list: ${names}.`;
}

function formatInventoryItemForAnswer(item: AssistantInventoryItem) {
  const dateLabel = item.expirationDate ? formatRelativeExpiration(item.expirationDate) : "no date";
  return `${item.name} (${item.quantity}, ${dateLabel})`;
}

function buildDefaultSuggestions(language: "bg" | "en") {
  if (language === "bg") {
    return [
      "Какво мога да сготвя днес?",
      "Кои продукти да използвам първо?",
      "Какво да направя с презрели банани?",
    ];
  }

  return [
    "What can I cook today?",
    "Which products should I use first?",
    "What can I make with overripe bananas?",
  ];
}

function findInventoryItem(inventory: AssistantInventoryItem[], terms: string[]) {
  return inventory.find((item) => {
    const normalized = normalizeText(item.name);
    return terms.some((term) => normalized.includes(term));
  });
}

function buildUseFirstFallback(context: AssistantRuntimeContext, language: "bg" | "en"): AssistantAiResponseInput {
  const expiring = context.inventory.filter((item) => item.status === "expiring").slice(0, 6);
  const expired = context.inventory.filter((item) => item.status === "expired").slice(0, 3);

  if (language === "bg") {
    if (expiring.length === 0 && expired.length === 0) {
      return {
        answer: "В момента не виждам продукти с близък или изтекъл срок. Започни с отворените или по-деликатни продукти като млечни, плодове и зеленчуци.",
        intent: "answer",
        shopping_items: [],
        follow_up_suggestions: buildDefaultSuggestions(language),
      };
    }

    const safeItems = expiring.map(formatInventoryItemForAnswer).join("; ");
    const expiredNote =
      expired.length > 0
        ? ` Проверѝ отделно изтеклите продукти и не рискувай с тях: ${expired
            .map(formatInventoryItemForAnswer)
            .join("; ")}.`
        : "";

    return {
      answer: `Използвай първо безопасните продукти с наближаващ срок: ${safeItems || "няма такива в момента"}.${expiredNote}`,
      intent: "answer",
      shopping_items: [],
      follow_up_suggestions: ["Дай ми рецепта с тези продукти", "Направи план за вечеря"],
    };
  }

  if (expiring.length === 0 && expired.length === 0) {
    return {
      answer: "I do not see items near or past expiration right now. Start with opened or delicate products like dairy, fruit, and vegetables.",
      intent: "answer",
      shopping_items: [],
      follow_up_suggestions: buildDefaultSuggestions(language),
    };
  }

  const safeItems = expiring.map(formatInventoryItemForAnswer).join("; ");
  const expiredNote =
    expired.length > 0
      ? ` Check expired products separately and do not take risks with them: ${expired
          .map(formatInventoryItemForAnswer)
          .join("; ")}.`
      : "";

  return {
    answer: `Use the safe expiring items first: ${safeItems || "none right now"}.${expiredNote}`,
    intent: "answer",
    shopping_items: [],
    follow_up_suggestions: ["Give me a recipe with these", "Plan dinner around them"],
  };
}

function buildBananaFallback(context: AssistantRuntimeContext, language: "bg" | "en"): AssistantAiResponseInput {
  const banana = findInventoryItem(context.inventory, ["banana", "банан"]);
  const eggs = findInventoryItem(context.inventory, ["egg", "яйц"]);
  const milk = findInventoryItem(context.inventory, ["milk", "мляко"]);
  const pantryHints = [eggs?.name, milk?.name].filter(Boolean).join(" и ");

  if (language === "bg") {
    return {
      answer: `С презрели банани най-добре направи бананов хляб, бързи палачинки или смути. ${
        banana ? `В инвентара виждам ${formatInventoryItemForAnswer(banana)}. ` : ""
      }${pantryHints ? `Можеш да ги комбинираш с ${pantryHints}. ` : ""}Ако няма да ги готвиш днес, нарежи ги и ги замрази за смутита.`,
      intent: "answer",
      shopping_items: [],
      follow_up_suggestions: ["Дай ми рецепта за бананов хляб", "Какво липсва за бананов хляб?"],
    };
  }

  return {
    answer: `Overripe bananas are best for banana bread, quick pancakes, or smoothies. ${
      banana ? `I see ${formatInventoryItemForAnswer(banana)} in your inventory. ` : ""
    }${pantryHints ? `You can pair them with ${pantryHints}. ` : ""}If you will not cook them today, slice and freeze them for smoothies.`,
    intent: "answer",
    shopping_items: [],
    follow_up_suggestions: ["Give me a banana bread recipe", "What is missing for banana bread?"],
  };
}

function buildCookingFallback(context: AssistantRuntimeContext, language: "bg" | "en"): AssistantAiResponseInput {
  const candidates = context.inventory
    .filter((item) => item.status !== "expired")
    .slice(0, 6);
  const itemNames = candidates.map((item) => item.name).join(", ");

  if (language === "bg") {
    if (candidates.length === 0) {
      return {
        answer: "Нямам достатъчно безопасни продукти в инвентара, за да предложа конкретна вечеря. Добави няколко продукта или провери дали изтеклите са годни.",
        intent: "answer",
        shopping_items: [],
        follow_up_suggestions: ["Добави продукти в списъка", "Кои продукти са с близък срок?"],
      };
    }

    return {
      answer: `Днес бих готвил около тези продукти: ${itemNames}. Най-безопасният подход е бърза купа, омлет/фритата или паста/ориз с наличните зеленчуци и протеин, като първо използваш продуктите с наближаващ срок.`,
      intent: "answer",
      shopping_items: [],
      follow_up_suggestions: ["Дай ми конкретна рецепта", "Кои продукти да използвам първо?"],
    };
  }

  if (candidates.length === 0) {
    return {
      answer: "I do not have enough safe inventory items to suggest a specific meal. Add a few products or inspect any expired items before using them.",
      intent: "answer",
      shopping_items: [],
      follow_up_suggestions: ["Add items to shopping", "Which products expire soon?"],
    };
  }

  return {
    answer: `Today I would cook around these items: ${itemNames}. A quick bowl, omelet/frittata, or pasta/rice dish would work well while using the closest-to-expire products first.`,
    intent: "answer",
    shopping_items: [],
    follow_up_suggestions: ["Give me a specific recipe", "Which products should I use first?"],
  };
}

function buildGenericFallback(context: AssistantRuntimeContext, language: "bg" | "en"): AssistantAiResponseInput {
  if (language === "bg") {
    return {
      answer: `Виждам ${context.inventory.length} продукта в инвентара и ${context.shopping.items.length} артикула в списъка за пазаруване. Мога да помогна с идея за готвене, приоритет по срокове или добавяне към списъка.`,
      intent: "answer",
      shopping_items: [],
      follow_up_suggestions: buildDefaultSuggestions(language),
    };
  }

  return {
    answer: `I can see ${context.inventory.length} inventory items and ${context.shopping.items.length} shopping list items. I can help with meal ideas, expiration priorities, or shopping list updates.`,
    intent: "answer",
    shopping_items: [],
    follow_up_suggestions: buildDefaultSuggestions(language),
  };
}

function buildFallbackAssistantResponse(
  context: AssistantRuntimeContext,
  latestMessage: string
): AssistantAiResponseInput {
  const language = detectLanguage(latestMessage);
  const normalized = normalizeText(latestMessage);

  if (isExplicitShoppingAdd(latestMessage)) {
    return {
      answer: language === "bg" ? "Ще обновя списъка за пазаруване." : "I will update the shopping list.",
      intent: "shopping_add",
      shopping_items: parseShoppingItemsFromText(latestMessage).map((item) => ({
        name: item.name,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
      })),
      follow_up_suggestions: buildDefaultSuggestions(language),
    };
  }

  if (
    normalized.includes("първо") ||
    normalized.includes("срок") ||
    normalized.includes("expire") ||
    normalized.includes("use first")
  ) {
    return buildUseFirstFallback(context, language);
  }

  if (
    (normalized.includes("банан") || normalized.includes("banana")) &&
    (normalized.includes("презр") || normalized.includes("overripe") || normalized.includes("ripe"))
  ) {
    return buildBananaFallback(context, language);
  }

  if (
    normalized.includes("сготв") ||
    normalized.includes("готв") ||
    normalized.includes("cook") ||
    normalized.includes("make")
  ) {
    return buildCookingFallback(context, language);
  }

  return buildGenericFallback(context, language);
}

async function logAssistantGeneration(params: {
  userId: string;
  householdId: string;
  messages: AssistantChatMessageInput[];
  context: AssistantRuntimeContext;
  result: unknown;
  model?: string | null;
  provider?: string | null;
  tokens?: number | null;
  cost?: number | null;
  status: "success" | "error";
}) {
  const modelLabel = params.provider && params.model ? `${params.provider}:${params.model}` : params.model ?? null;
  const latestMessage = params.messages[params.messages.length - 1]?.content ?? "";

  await db.insert(schema.ai_generations).values({
    user_id: params.userId,
    household_id: params.householdId,
    generation_type: "assistant_chat",
    prompt: {
      latestMessage,
      messages: params.messages.slice(-6),
      inventoryCount: params.context.inventory.length,
      shoppingItemCount: params.context.shopping.items.length,
    },
    result: params.result ?? {},
    model: modelLabel,
    tokens: params.tokens ?? null,
    cost: params.cost != null ? String(params.cost) : null,
    status: params.status,
  });
}

export async function getAssistantPageData(user: AssistantUser) {
  const context = await getAssistantRuntimeContext(user);
  return context.summary;
}

export async function runAssistantChat(params: {
  user: AssistantUser;
  messages: AssistantChatMessageInput[];
}): Promise<AssistantChatResponse> {
  assertRateLimit(`assistant:${params.user.id}`, 10, 60_000);

  const context = await getAssistantRuntimeContext(params.user);
  const latestMessage = params.messages[params.messages.length - 1]?.content ?? "";
  const language = detectLanguage(latestMessage);
  const canAddShoppingItems = isExplicitShoppingAdd(latestMessage);

  let aiResult: AssistantAiResult | null = null;
  let aiData: AssistantAiResponseInput;
  let fallback = false;
  let fallbackReason: string | null = null;

  try {
    aiResult = await generateAssistantAiResponse(params.messages, context, params.user.id);
    aiData = aiResult.data;
  } catch (error) {
    fallback = true;
    fallbackReason = cleanErrorMessage(error);
    aiData = buildFallbackAssistantResponse(context, latestMessage);

    await logAssistantGeneration({
      userId: params.user.id,
      householdId: context.household.id,
      messages: params.messages,
      context,
      result: { error: fallbackReason },
      provider: context.aiSettings.provider,
      model: context.aiSettings.model,
      status: "error",
    }).catch(() => undefined);
  }

  if (aiData.intent === "shopping_add" && !canAddShoppingItems) {
    aiData = buildFallbackAssistantResponse(context, latestMessage);
  }

  let answer = aiData.answer;
  const executedActions: AssistantExecutedAction[] = [];

  if (canAddShoppingItems) {
    const shoppingItems = normalizeShoppingItems(
      aiData.shopping_items.length > 0 ? aiData.shopping_items : parseShoppingItemsFromText(latestMessage)
    );

    if (shoppingItems.length > 0) {
      const result = await addUniqueItemsToShoppingList(context.household.id, params.user.id, shoppingItems, {
        listName: "Weekly groceries",
      });
      const action: AssistantExecutedAction = {
        type: "add_to_shopping_list",
        items: shoppingItems,
        insertedCount: result.insertedCount,
        skippedCount: result.skippedCount,
        listId: result.listId,
      };

      executedActions.push(action);
      answer = buildShoppingConfirmation(shoppingItems, action, language);

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/shopping");
      revalidatePath("/dashboard/assistant");
    }
  }

  const freshContext = executedActions.length > 0 ? await getAssistantRuntimeContext(params.user) : context;
  const response: AssistantChatResponse = {
    answer,
    suggestions: aiData.follow_up_suggestions.length > 0 ? aiData.follow_up_suggestions : buildDefaultSuggestions(language),
    executedActions,
    contextSummary: freshContext.summary,
    fallback,
    fallbackReason,
  };

  await logAssistantGeneration({
    userId: params.user.id,
    householdId: context.household.id,
    messages: params.messages,
    context: freshContext,
    result: response,
    provider: aiResult?.provider ?? (fallback ? "ollama" : context.aiSettings.provider),
    model: aiResult?.model ?? (fallback ? "deterministic-fallback" : context.aiSettings.model),
    tokens: aiResult?.usage.totalTokens ?? null,
    cost: aiResult?.cost ?? null,
    status: "success",
  }).catch(() => undefined);

  return response;
}
