import "server-only";

import { aiGateway } from "@/ai/gateway";
import { parsedReceiptSchema } from "@/ai-parsing/schemas";
import { addDaysToDate, estimateShelfLife, toDateInputValue } from "@/scanning/shelf-life";
import type { ParsedReceipt, ReceiptItemExtraction } from "@/scanning/types";

const RECEIPT_NOISE_PATTERNS = [
  /subtotal|total|tax|visa|mastercard|amex|cash|change|balance|approval|auth/i,
  /thank you|customer copy|merchant|receipt|cashier|terminal|transaction/i,
  /^\d{2,4}[-/]\d{2,4}[-/]\d{2,4}/,
  /^[#*\-_=]+$/,
];

function parsePriceFromLine(line: string) {
  const match = line.match(/(?:\$|USD\s*)?(\d{1,4}[.,]\d{2})\s*$/i);
  if (!match) return null;
  return Number(match[1].replace(",", "."));
}

function cleanLineToName(line: string) {
  return line
    .replace(/(?:\$|USD\s*)?\d{1,4}[.,]\d{2}\s*$/i, "")
    .replace(/\b\d{8,14}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inferQuantity(name: string) {
  const match = name.match(/\b(\d+(?:[.,]\d+)?)\s?(ct|pk|pack|lb|lbs|oz|g|kg|ml|l)\b/i);
  if (!match) return { quantity: 1, unit: null as string | null, cleanedName: name };

  return {
    quantity: Number(match[1].replace(",", ".")) || 1,
    unit: match[2].toLowerCase(),
    cleanedName: name.replace(match[0], "").replace(/\s{2,}/g, " ").trim() || name,
  };
}

function normalizeReceiptItem(line: string, purchaseDate: Date): ReceiptItemExtraction | null {
  const compact = line.replace(/\s{2,}/g, " ").trim();
  if (compact.length < 3) return null;
  if (RECEIPT_NOISE_PATTERNS.some((pattern) => pattern.test(compact))) return null;

  const price = parsePriceFromLine(compact);
  const name = cleanLineToName(compact);
  if (name.length < 2 || /^\d+$/.test(name)) return null;

  const inferred = inferQuantity(name);
  const estimate = estimateShelfLife(inferred.cleanedName);

  return {
    name: inferred.cleanedName,
    normalizedName: inferred.cleanedName.toLowerCase(),
    quantity: inferred.quantity,
    unit: inferred.unit,
    price,
    brand: null,
    category: estimate.category,
    shelfLifeDays: estimate.shelfLifeDays,
    expirationDate: toDateInputValue(addDaysToDate(purchaseDate, estimate.shelfLifeDays)),
    storageLocation: estimate.storageLocation,
    confidence: price == null ? 0.45 : 0.58,
    selected: true,
  };
}

export function parseReceiptHeuristically(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dateLine = lines.find((line) => /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(line));
  const dateMatch = dateLine?.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  const purchaseDate = dateMatch
    ? new Date(
        Number(dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]),
        Number(dateMatch[1]) - 1,
        Number(dateMatch[2])
      )
    : new Date();

  const totalLine = [...lines].reverse().find((line) => /total/i.test(line) && parsePriceFromLine(line) != null);
  const items = lines
    .map((line) => normalizeReceiptItem(line, purchaseDate))
    .filter((item): item is ReceiptItemExtraction => Boolean(item))
    .slice(0, 80);

  return {
    storeName: lines[0] && lines[0].length <= 120 ? lines[0] : null,
    purchaseDate: toDateInputValue(purchaseDate),
    total: totalLine ? parsePriceFromLine(totalLine) : null,
    currency: "USD",
    items,
    rawText,
    warnings: items.length === 0 ? ["No item lines were detected. Review OCR text and try parsing again."] : [],
  };
}

function normalizeAIReceipt(rawText: string, parsed: unknown): ParsedReceipt {
  const validated = parsedReceiptSchema.parse(parsed);
  const purchaseDate = validated.purchaseDate ? new Date(validated.purchaseDate) : new Date();

  const items = validated.items.map((item) => {
    const estimate = estimateShelfLife(item.name, item.category);
    const shelfLifeDays = item.shelfLifeDays ?? estimate.shelfLifeDays;

    return {
      ...item,
      category: item.category ?? estimate.category,
      shelfLifeDays,
      expirationDate: item.expirationDate ?? toDateInputValue(addDaysToDate(purchaseDate, shelfLifeDays)),
      storageLocation: item.storageLocation ?? estimate.storageLocation,
      selected: true,
    };
  });

  return {
    ...validated,
    items,
    rawText,
    warnings: validated.warnings ?? [],
  };
}

export async function parseReceiptText(rawText: string): Promise<ParsedReceipt> {
  const fallback = parseReceiptHeuristically(rawText);

  try {
    const response = await aiGateway.generateJSON(
      {
        temperature: 0.1,
        maxTokens: 2400,
        messages: [
          {
            role: "system",
            content:
              "You extract grocery receipt data for a food waste inventory app. Return strict JSON only. Correct OCR mistakes, ignore non-food/payment rows, infer sensible food categories, units, storage locations, and shelf-life days. Use ISO YYYY-MM-DD dates when known.",
          },
          {
            role: "user",
            content: `Today is ${toDateInputValue(new Date())}. Extract storeName, purchaseDate, total, currency, and food items from this OCR text:\n\n${rawText}`,
          },
        ],
        jsonSchema: {
          type: "object",
          required: ["storeName", "purchaseDate", "total", "currency", "items", "warnings"],
          properties: {
            storeName: { type: ["string", "null"] },
            purchaseDate: { type: ["string", "null"], description: "YYYY-MM-DD when available" },
            total: { type: ["number", "null"] },
            currency: { type: ["string", "null"] },
            warnings: { type: "array", items: { type: "string" } },
            items: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "name",
                  "normalizedName",
                  "quantity",
                  "unit",
                  "price",
                  "brand",
                  "category",
                  "shelfLifeDays",
                  "expirationDate",
                  "storageLocation",
                  "confidence",
                ],
                properties: {
                  name: { type: "string" },
                  normalizedName: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: ["string", "null"] },
                  price: { type: ["number", "null"] },
                  brand: { type: ["string", "null"] },
                  category: { type: ["string", "null"] },
                  shelfLifeDays: { type: ["number", "null"] },
                  expirationDate: { type: ["string", "null"], description: "YYYY-MM-DD when inferred" },
                  storageLocation: { type: ["string", "null"] },
                  confidence: { type: "number" },
                },
              },
            },
          },
        },
      },
      parsedReceiptSchema
    );

    const parsed = normalizeAIReceipt(rawText, response.outputJson);
    if (parsed.items.length === 0 && fallback.items.length > 0) return fallback;
    return parsed;
  } catch {
    return {
      ...fallback,
      warnings: [...fallback.warnings, "AI parsing was unavailable, so heuristic extraction was used."],
    };
  }
}
