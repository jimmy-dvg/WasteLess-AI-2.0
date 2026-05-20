import "server-only";

import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { getPrimaryHouseholdForUser } from "@/db/queries/households";
import * as schema from "@/db/schema/tables";
import { getCachedValue, setCachedValue } from "@/lib/cache";
import { estimateShelfLife } from "@/scanning/shelf-life";
import type {
  BarcodeLookupResult,
  BarcodeProductMetadata,
  BarcodeProviderId,
  ScannedProductDuplicate,
} from "@/scanning/types";

const PRODUCT_LOOKUP_TTL_MS = 1000 * 60 * 60 * 24;
const SUPPORTED_NUMERIC_BARCODE = /^\d{8,14}$/;

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  quantity?: string;
  serving_size?: string;
  image_front_url?: string;
  image_url?: string;
  ingredients_text?: string;
  nutriments?: Record<string, unknown>;
};

type OpenFoodFactsResponse = {
  status?: number;
  product?: OpenFoodFactsProduct;
};

type USDAFood = {
  description?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  foodCategory?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: Array<{ nutrientName?: string; value?: number; unitName?: string }>;
};

type USDASearchResponse = {
  foods?: USDAFood[];
};

type BarcodeLookupApiResponse = {
  products?: Array<{
    barcode_number?: string;
    title?: string;
    brand?: string;
    category?: string;
    images?: string[];
  }>;
};

export function normalizeBarcode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function sourcePriority(source: BarcodeProviderId) {
  switch (source) {
    case "open_food_facts":
      return 3;
    case "usda_fdc":
      return 2;
    case "barcode_lookup":
      return 1;
    case "local_cache":
    default:
      return 0;
  }
}

function cleanCategory(value?: string | null) {
  if (!value) return null;
  const raw = value.split(",").map((entry) => entry.trim()).filter(Boolean).at(-1) ?? value;
  return raw.replace(/^en:/, "").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseQuantity(value?: string | null) {
  if (!value) return { quantity: null as string | null, unit: null as string | null };
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?/);
  if (!match) return { quantity: value, unit: null };
  return {
    quantity: match[1].replace(",", "."),
    unit: match[2]?.toLowerCase() ?? null,
  };
}

function withShelfLife(product: Omit<BarcodeProductMetadata, "shelfLifeDays" | "storageLocation">) {
  const estimate = estimateShelfLife(product.name, product.category);
  return {
    ...product,
    category: product.category ?? estimate.category,
    shelfLifeDays: estimate.shelfLifeDays,
    storageLocation: estimate.storageLocation,
  } satisfies BarcodeProductMetadata;
}

function fromOpenFoodFacts(barcode: string, data: OpenFoodFactsResponse): BarcodeProductMetadata | null {
  const product = data.product;
  const name = product?.product_name || product?.generic_name;
  if (data.status !== 1 || !product || !name) return null;

  const quantity = parseQuantity(product.quantity);
  const category = cleanCategory(product.categories_tags?.at(-1) ?? product.categories);

  return withShelfLife({
    barcode,
    name,
    brand: product.brands || null,
    category,
    quantity: quantity.quantity,
    unit: quantity.unit,
    imageUrl: product.image_front_url || product.image_url || null,
    ingredients: product.ingredients_text || null,
    servingSize: product.serving_size || null,
    nutrition: product.nutriments ?? {},
    source: "open_food_facts",
    confidence: 0.92,
    raw: product,
  });
}

function fromUSDA(barcode: string, data: USDASearchResponse): BarcodeProductMetadata | null {
  const food = data.foods?.find((entry) => entry.gtinUpc === barcode) ?? data.foods?.[0];
  if (!food?.description) return null;

  const nutrition = Object.fromEntries(
    (food.foodNutrients ?? [])
      .filter((nutrient) => nutrient.nutrientName && nutrient.value != null)
      .slice(0, 20)
      .map((nutrient) => [
        nutrient.nutrientName as string,
        { value: nutrient.value, unit: nutrient.unitName ?? null },
      ])
  );

  return withShelfLife({
    barcode,
    name: food.description,
    brand: food.brandName || food.brandOwner || null,
    category: food.foodCategory || null,
    quantity: food.servingSize != null ? String(food.servingSize) : null,
    unit: food.servingSizeUnit || null,
    imageUrl: null,
    ingredients: null,
    servingSize:
      food.servingSize != null ? `${food.servingSize}${food.servingSizeUnit ? ` ${food.servingSizeUnit}` : ""}` : null,
    nutrition,
    source: "usda_fdc",
    confidence: food.gtinUpc === barcode ? 0.86 : 0.64,
    raw: food,
  });
}

function fromBarcodeLookup(barcode: string, data: BarcodeLookupApiResponse): BarcodeProductMetadata | null {
  const product = data.products?.[0];
  if (!product?.title) return null;

  return withShelfLife({
    barcode,
    name: product.title,
    brand: product.brand || null,
    category: cleanCategory(product.category),
    quantity: null,
    unit: null,
    imageUrl: product.images?.[0] ?? null,
    ingredients: null,
    servingSize: null,
    nutrition: {},
    source: "barcode_lookup",
    confidence: product.barcode_number === barcode ? 0.78 : 0.6,
    raw: product,
  });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      "User-Agent": "WasteLessAI/1.0 (https://wastelessai.com)",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function lookupOpenFoodFacts(barcode: string) {
  const fields = [
    "code",
    "product_name",
    "generic_name",
    "brands",
    "categories",
    "categories_tags",
    "quantity",
    "serving_size",
    "image_front_url",
    "image_url",
    "ingredients_text",
    "nutriments",
  ].join(",");
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}.json?fields=${fields}`;
  const data = await fetchJson<OpenFoodFactsResponse>(url);
  return data ? fromOpenFoodFacts(barcode, data) : null;
}

async function lookupUSDA(barcode: string) {
  const apiKey = process.env.USDA_FDC_API_KEY?.trim();
  if (!apiKey || !SUPPORTED_NUMERIC_BARCODE.test(barcode)) return null;

  const data = await fetchJson<USDASearchResponse>(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: barcode,
        dataType: ["Branded"],
        pageSize: 5,
        sortBy: "fdcId",
        sortOrder: "desc",
      }),
    }
  );

  return data ? fromUSDA(barcode, data) : null;
}

async function lookupBarcodeLookupApi(barcode: string) {
  const apiKey = process.env.BARCODE_LOOKUP_API_KEY?.trim();
  if (!apiKey || !SUPPORTED_NUMERIC_BARCODE.test(barcode)) return null;

  const url = `https://api.barcodelookup.com/v3/products?barcode=${encodeURIComponent(
    barcode
  )}&formatted=y&key=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson<BarcodeLookupApiResponse>(url);
  return data ? fromBarcodeLookup(barcode, data) : null;
}

async function getCachedBarcodeProduct(barcode: string): Promise<BarcodeProductMetadata | null> {
  const memoryCached = getCachedValue<BarcodeProductMetadata>(`barcode:${barcode}`);
  if (memoryCached) return memoryCached;

  const rows = await db
    .select()
    .from(schema.barcode_products)
    .where(eq(schema.barcode_products.barcode, barcode))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const metadata = row.metadata as Partial<BarcodeProductMetadata> | null;
  const product = withShelfLife({
    barcode: row.barcode,
    name: row.name,
    brand: row.brand ?? null,
    category: row.category ?? null,
    quantity: metadata?.quantity ?? null,
    unit: metadata?.unit ?? null,
    imageUrl: metadata?.imageUrl ?? null,
    ingredients: metadata?.ingredients ?? null,
    servingSize: metadata?.servingSize ?? null,
    nutrition: metadata?.nutrition ?? {},
    source: "local_cache",
    confidence: metadata?.confidence ?? 0.7,
    raw: metadata?.raw,
  });

  setCachedValue(`barcode:${barcode}`, product, PRODUCT_LOOKUP_TTL_MS);
  return product;
}

async function cacheBarcodeProduct(product: BarcodeProductMetadata) {
  await db
    .insert(schema.barcode_products)
    .values({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      category: product.category,
      metadata: product,
      source: product.source,
      last_lookup_at: new Date(),
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.barcode_products.barcode,
      set: {
        name: product.name,
        brand: product.brand,
        category: product.category,
        metadata: product,
        source: product.source,
        last_lookup_at: new Date(),
        updated_at: new Date(),
      },
    });

  setCachedValue(`barcode:${product.barcode}`, product, PRODUCT_LOOKUP_TTL_MS);
}

async function findDuplicates(userId: string, barcode: string, productName?: string): Promise<ScannedProductDuplicate[]> {
  const household = await getPrimaryHouseholdForUser(userId);
  const nameCondition = productName ? eq(schema.products.name, productName) : undefined;
  const duplicateCondition = nameCondition
    ? or(eq(schema.products.gtin, barcode), nameCondition)
    : eq(schema.products.gtin, barcode);
  const scopeCondition = household
    ? or(
        eq(schema.products.household_id, household.id),
        and(isNull(schema.products.household_id), eq(schema.products.user_id, userId))
      )!
    : eq(schema.products.user_id, userId);

  const rows = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      quantity: schema.products.quantity,
      unit: schema.products.unit,
      expirationDate: schema.products.expiration_date,
      storageLocation: schema.products.storage_location,
    })
    .from(schema.products)
    .where(and(scopeCondition, duplicateCondition))
    .orderBy(desc(schema.products.created_at))
    .limit(5);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    quantity: row.quantity == null ? null : String(row.quantity),
    unit: row.unit ?? null,
    expirationDate: row.expirationDate ?? null,
    storageLocation: row.storageLocation ?? null,
  }));
}

export async function lookupBarcodeProduct(
  userId: string,
  rawBarcode: string
): Promise<BarcodeLookupResult> {
  const barcode = normalizeBarcode(rawBarcode);
  const providersTried: BarcodeProviderId[] = ["local_cache"];
  const warnings: string[] = [];

  const cached = await getCachedBarcodeProduct(barcode);
  if (cached) {
    return {
      found: true,
      product: cached,
      providersTried,
      duplicates: await findDuplicates(userId, barcode, cached.name),
      warnings,
    };
  }

  if (!SUPPORTED_NUMERIC_BARCODE.test(barcode)) {
    warnings.push("This barcode format was scanned, but product lookup only supports numeric UPC/EAN/GTIN codes.");
    return {
      found: false,
      product: null,
      providersTried,
      duplicates: await findDuplicates(userId, barcode),
      warnings,
    };
  }

  const lookups: Array<[BarcodeProviderId, () => Promise<BarcodeProductMetadata | null>]> = [
    ["open_food_facts", () => lookupOpenFoodFacts(barcode)],
    ["usda_fdc", () => lookupUSDA(barcode)],
    ["barcode_lookup", () => lookupBarcodeLookupApi(barcode)],
  ];

  const results: BarcodeProductMetadata[] = [];

  for (const [provider, lookup] of lookups) {
    providersTried.push(provider);
    try {
      const product = await lookup();
      if (product) results.push(product);
    } catch {
      warnings.push(`${provider} lookup failed.`);
    }
  }

  const product =
    results.sort(
      (left, right) => right.confidence - left.confidence || sourcePriority(right.source) - sourcePriority(left.source)
    )[0] ?? null;

  if (product) {
    await cacheBarcodeProduct(product);
  }

  return {
    found: Boolean(product),
    product,
    providersTried,
    duplicates: await findDuplicates(userId, barcode, product?.name),
    warnings,
  };
}
