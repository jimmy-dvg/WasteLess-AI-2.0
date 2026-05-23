import "server-only";

import { parsedReceiptSchema } from "@/ai-parsing/schemas";
import { CATEGORY_NAMES, STORAGE_ZONE_VALUES } from "@/features/categories/constants";
import { addDaysToDate, estimateShelfLife, toDateInputValue } from "@/scanning/shelf-life";
import type { ParsedReceipt, PhotoScanMode } from "@/scanning/types";

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type OpenAIErrorResponse = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

type PhotoRecognitionProvider = "openai" | "gemini";

type RecognitionAttempt = {
  provider: PhotoRecognitionProvider;
  result: ParsedReceipt;
  failed: boolean;
};

function getVisionConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  };
}

function getGeminiVisionConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const configuredModel = process.env.GEMINI_VISION_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const modelChain = (process.env.GEMINI_VISION_MODEL_CHAIN ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return {
    apiKey,
    modelChain: uniqueModels([
      configuredModel,
      ...modelChain,
      "gemini-2.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ]),
  };
}

function getProviderPreference(): "auto" | PhotoRecognitionProvider {
  const value = process.env.PHOTO_RECOGNITION_PROVIDER?.trim().toLowerCase();
  return value === "openai" || value === "gemini" ? value : "auto";
}

function modeLabel(mode: PhotoScanMode) {
  if (mode === "fridge_photo") return "fridge photo";
  if (mode === "shelf_photo") return "pantry shelf photo";
  return "food photo";
}

function uniqueModels(models: string[]) {
  const seen = new Set<string>();
  return models
    .map((model) => model.replace(/^models\//, "").trim())
    .filter((model) => {
      if (!model || seen.has(model)) return false;
      seen.add(model);
      return true;
    });
}

function emptyPhotoResult(mode: PhotoScanMode, warning: string): ParsedReceipt {
  return {
    storeName: mode === "fridge_photo" ? "Fridge photo" : mode === "shelf_photo" ? "Pantry shelf photo" : "Food photo",
    purchaseDate: toDateInputValue(new Date()),
    total: null,
    currency: "USD",
    items: [],
    rawText: `AI photo recognition from ${modeLabel(mode)}`,
    warnings: [warning],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function pickRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return { items: value };
  if (!isRecord(value)) return { items: [] };

  const nested = value.result ?? value.receipt ?? value.inventory ?? value.analysis ?? value.data;
  if (isRecord(nested) || Array.isArray(nested)) {
    return pickRecord(nested);
  }

  return value;
}

function pickArray(record: Record<string, unknown>) {
  const candidates = [
    record.items,
    record.products,
    record.foodItems,
    record.food_items,
    record.detectedItems,
    record.detected_items,
    record.inventoryItems,
    record.inventory_items,
  ];

  return candidates.find(Array.isArray) ?? [];
}

function stringFrom(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function numberFrom(value: unknown, fallback: number | null = null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0];
    if (normalized) {
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function nullableStringFrom(value: unknown) {
  return stringFrom(value);
}

function confidenceFrom(value: unknown) {
  const parsed = numberFrom(value, 0.6) ?? 0.6;
  return parsed > 1 ? Math.min(1, parsed / 100) : Math.max(0, Math.min(1, parsed));
}

function warningsFrom(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => stringFrom(entry)).filter((entry): entry is string => Boolean(entry));
  }
  const warning = stringFrom(value);
  return warning ? [warning] : [];
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function stripMarkdownJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractBalancedJson(value: string, openChar: "{" | "[", closeChar: "}" | "]") {
  const start = value.indexOf(openChar);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === openChar) depth += 1;
    if (char === closeChar) depth -= 1;

    if (depth === 0) {
      return value.slice(start, index + 1);
    }
  }

  return null;
}

function parseFlexibleJsonFromText(value: string) {
  const trimmed = stripMarkdownJsonFence(value);
  const direct = safeJsonParse(trimmed);
  if (direct) return direct;

  const objectJson = extractBalancedJson(trimmed, "{", "}");
  if (objectJson) {
    const parsed = safeJsonParse(objectJson);
    if (parsed) return parsed;
  }

  const arrayJson = extractBalancedJson(trimmed, "[", "]");
  if (arrayJson) {
    const parsed = safeJsonParse(arrayJson);
    if (parsed) return parsed;
  }

  return null;
}

function normalizePhotoPayload(parsed: unknown, mode: PhotoScanMode) {
  const record = pickRecord(parsed);
  const rawItems = pickArray(record);
  const today = new Date();

  const items = rawItems
    .filter(isRecord)
    .map((item) => {
      const name =
        stringFrom(item.name) ??
        stringFrom(item.normalizedName) ??
        stringFrom(item.normalized_name) ??
        stringFrom(item.productName) ??
        stringFrom(item.product_name) ??
        stringFrom(item.itemName) ??
        stringFrom(item.item_name) ??
        stringFrom(item.label) ??
        stringFrom(item.description);

      if (!name) return null;

      const category = nullableStringFrom(item.category ?? item.type ?? item.foodCategory ?? item.food_category);
      const estimate = estimateShelfLife(name, category);
      const shelfLifeDays =
        numberFrom(item.shelfLifeDays ?? item.shelf_life_days ?? item.estimatedShelfLifeDays, null) ??
        estimate.shelfLifeDays;

      return {
        name,
        normalizedName:
          stringFrom(item.normalizedName) ??
          stringFrom(item.normalized_name) ??
          stringFrom(item.canonicalName) ??
          name,
        quantity: numberFrom(item.quantity ?? item.count ?? item.visibleCount ?? item.visible_count, 1) ?? 1,
        unit: nullableStringFrom(item.unit ?? item.units) ?? "item",
        price: null,
        brand: nullableStringFrom(item.brand ?? item.brandName ?? item.brand_name),
        category: category ?? estimate.category,
        shelfLifeDays,
        expirationDate:
          nullableStringFrom(item.expirationDate ?? item.expiration_date ?? item.bestBefore ?? item.best_before) ??
          toDateInputValue(addDaysToDate(today, shelfLifeDays)),
        storageLocation:
          nullableStringFrom(item.storageLocation ?? item.storage_location ?? item.location) ??
          estimate.storageLocation,
        confidence: confidenceFrom(item.confidence ?? item.score ?? item.probability),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    storeName:
      nullableStringFrom(record.storeName ?? record.store_name ?? record.sourceName ?? record.source_name) ??
      (mode === "fridge_photo" ? "Fridge photo" : mode === "shelf_photo" ? "Pantry shelf photo" : "Food photo"),
    purchaseDate:
      nullableStringFrom(record.purchaseDate ?? record.purchase_date ?? record.date) ?? toDateInputValue(today),
    total: numberFrom(record.total, null),
    currency: nullableStringFrom(record.currency) ?? "USD",
    items,
    warnings: warningsFrom(record.warnings ?? record.warning),
  };
}

function getOpenAIStatusMessage(status: number, errorBody: OpenAIErrorResponse | null) {
  const providerMessage = errorBody?.error?.message?.trim();

  switch (status) {
    case 400:
      return providerMessage
        ? `OpenAI rejected the photo recognition request: ${providerMessage}`
        : "OpenAI rejected the photo recognition request. Check that OPENAI_VISION_MODEL supports image input.";
    case 401:
      return "OpenAI photo recognition is not authorized. Check that OPENAI_API_KEY is present and valid.";
    case 403:
      return providerMessage
        ? `OpenAI photo recognition is blocked for this key: ${providerMessage}`
        : "OpenAI photo recognition is blocked for this key. Check project permissions and model access.";
    case 429:
      return providerMessage
        ? `OpenAI photo recognition hit a rate or quota limit: ${providerMessage}`
        : "OpenAI photo recognition hit a rate or quota limit. Check billing/usage limits or try again later.";
    default:
      return providerMessage
        ? `OpenAI photo recognition failed: ${providerMessage}`
        : `OpenAI photo recognition failed with status ${status}.`;
  }
}

async function readOpenAIError(response: Response) {
  try {
    return (await response.json()) as OpenAIErrorResponse;
  } catch {
    return null;
  }
}

function normalizePhotoResult(mode: PhotoScanMode, parsed: unknown): ParsedReceipt {
  const validated = parsedReceiptSchema.parse(normalizePhotoPayload(parsed, mode));
  const today = new Date();

  return {
    storeName:
      validated.storeName ??
      (mode === "fridge_photo" ? "Fridge photo" : mode === "shelf_photo" ? "Pantry shelf photo" : "Food photo"),
    purchaseDate: validated.purchaseDate ?? toDateInputValue(today),
    total: null,
    currency: validated.currency ?? "USD",
    rawText: `AI photo recognition from ${modeLabel(mode)}`,
    warnings: validated.warnings ?? [],
    items: validated.items.map((item) => {
      const estimate = estimateShelfLife(item.name, item.category);
      const shelfLifeDays = item.shelfLifeDays ?? estimate.shelfLifeDays;

      return {
        ...item,
        price: null,
        category: item.category ?? estimate.category,
        quantity: item.quantity || 1,
        unit: item.unit ?? "item",
        shelfLifeDays,
        storageLocation: item.storageLocation ?? estimate.storageLocation,
        expirationDate: item.expirationDate ?? toDateInputValue(addDaysToDate(today, shelfLifeDays)),
        confidence: Math.max(0, Math.min(1, item.confidence ?? 0.55)),
        selected: true,
      };
    }),
  };
}

async function recognizeWithOpenAI(
  buffer: Buffer,
  contentType: string,
  mode: PhotoScanMode
): Promise<RecognitionAttempt> {
  const config = getVisionConfig();
  if (!config) {
    return {
      provider: "openai",
      result: emptyPhotoResult(mode, "OpenAI vision is not configured. Add OPENAI_API_KEY to enable photo recognition."),
      failed: true,
    };
  }

  const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.1,
      max_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You identify visible food, ingredients, meals, packaged groceries, produce, and drinks in a photo for an inventory app. Return JSON only.",
            "Detect food from any setting; do not require a fridge, shelf, receipt, barcode, or package label.",
            "Infer product names, visible counts, units, category, storage location, shelfLifeDays, expirationDate when clear, and confidence.",
            `Use only these category labels when category is known: ${CATEGORY_NAMES.join(", ")}.`,
            `Use only these storageLocation labels when storage is known: ${STORAGE_ZONE_VALUES.join(", ")}.`,
            "Do not invent brands unless visible.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${modeLabel(
                mode
              )}. Detect all visible food items, ingredients, packaged groceries, produce, beverages, and prepared foods. Return JSON with storeName, purchaseDate, total, currency, items, warnings. Each item must include name, normalizedName, quantity, unit, price:null, brand, category, shelfLifeDays, expirationDate, storageLocation, confidence. If food is visible, items must not be empty. Today is ${toDateInputValue(
                new Date()
              )}.`,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    return {
      provider: "openai",
      result: emptyPhotoResult(mode, getOpenAIStatusMessage(response.status, await readOpenAIError(response))),
      failed: true,
    };
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return {
      provider: "openai",
      result: emptyPhotoResult(mode, "OpenAI photo recognition returned an empty response."),
      failed: true,
    };
  }

  const parsed = parseFlexibleJsonFromText(content);
  if (!parsed) {
    return {
      provider: "openai",
      result: emptyPhotoResult(mode, "OpenAI photo recognition returned malformed JSON."),
      failed: true,
    };
  }

  try {
    return {
      provider: "openai",
      result: normalizePhotoResult(mode, parsed),
      failed: false,
    };
  } catch {
    return {
      provider: "openai",
      result: emptyPhotoResult(mode, "OpenAI photo recognition response did not match the expected schema."),
      failed: true,
    };
  }
}

async function recognizeWithGemini(
  buffer: Buffer,
  contentType: string,
  mode: PhotoScanMode
): Promise<RecognitionAttempt> {
  const config = getGeminiVisionConfig();
  if (!config) {
    return {
      provider: "gemini",
      result: emptyPhotoResult(mode, "Gemini vision is not configured. Add GEMINI_API_KEY to enable fallback photo recognition."),
      failed: true,
    };
  }

  const failures: string[] = [];

  for (const model of config.modelChain) {
    const attempt = await recognizeWithGeminiModel(buffer, contentType, mode, config.apiKey, model);
    if (!attempt.failed && attempt.result.items.length > 0) {
      return attempt;
    }
    failures.push(
      ...(attempt.result.warnings.length
        ? attempt.result.warnings
        : [`Gemini model ${model} did not detect visible food items.`])
    );
  }

  return {
    provider: "gemini",
    result: emptyPhotoResult(mode, failures.join(" ")),
    failed: true,
  };
}

async function recognizeWithGeminiModel(
  buffer: Buffer,
  contentType: string,
  mode: PhotoScanMode,
  apiKey: string,
  model: string
): Promise<RecognitionAttempt> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: contentType,
                  data: buffer.toString("base64"),
                },
              },
              {
                text: `Analyze this ${modeLabel(
                  mode
                )}. Detect all visible food items, ingredients, packaged groceries, produce, beverages, and prepared foods from any setting. If food is visible, items must not be empty. Use category labels from ${CATEGORY_NAMES.join(
                  ", "
                )} and storageLocation labels from ${STORAGE_ZONE_VALUES.join(
                  ", "
                )}. Return JSON only. Use exactly this shape: {"storeName": string|null, "purchaseDate": "YYYY-MM-DD"|null, "total": null, "currency": "USD", "warnings": string[], "items": [{"name": string, "normalizedName": string, "quantity": number, "unit": string|null, "price": null, "brand": string|null, "category": string|null, "shelfLifeDays": number|null, "expirationDate": "YYYY-MM-DD"|null, "storageLocation": string|null, "confidence": number}]}. Do not use markdown. Today is ${toDateInputValue(
                  new Date()
                )}.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!response.ok) {
    const message = await safeGeminiErrorMessage(response);
    return {
      provider: "gemini",
      result: emptyPhotoResult(mode, `Gemini model ${model} failed: ${message}`),
      failed: true,
    };
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const content = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;

  if (!content) {
    return {
      provider: "gemini",
      result: emptyPhotoResult(mode, `Gemini model ${model} returned an empty response.`),
      failed: true,
    };
  }

  const parsed = parseFlexibleJsonFromText(content);
  if (!parsed) {
    return {
      provider: "gemini",
      result: emptyPhotoResult(mode, `Gemini model ${model} returned malformed JSON.`),
      failed: true,
    };
  }

  try {
    return {
      provider: "gemini",
      result: normalizePhotoResult(mode, parsed),
      failed: false,
    };
  } catch {
    return {
      provider: "gemini",
      result: emptyPhotoResult(mode, `Gemini model ${model} response did not match the expected schema.`),
      failed: true,
    };
  }
}

async function safeGeminiErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function recognizeFoodFromImage(
  buffer: Buffer,
  contentType: string,
  mode: PhotoScanMode
): Promise<ParsedReceipt> {
  const preference = getProviderPreference();
  const attempts =
    preference === "openai"
      ? [recognizeWithOpenAI]
      : preference === "gemini"
        ? [recognizeWithGemini]
        : [recognizeWithOpenAI, recognizeWithGemini];

  const failures: string[] = [];

  for (const attempt of attempts) {
    const result = await attempt(buffer, contentType, mode);
    if (!result.failed && result.result.items.length > 0) return result.result;
    failures.push(
      ...(result.result.warnings.length
        ? result.result.warnings
        : [`${result.provider} did not detect visible food items.`])
    );
  }

  return emptyPhotoResult(mode, failures.join(" "));
}
