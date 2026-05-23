import { addDaysToDate, toDateInputValue } from "@/scanning/shelf-life";
import type { BarcodeLookupResult, ParsedReceipt } from "@/scanning/types";

export function createSampleFoodPhotoResult(): ParsedReceipt {
  const today = new Date();

  return {
    storeName: "Sample food photo",
    purchaseDate: toDateInputValue(today),
    total: null,
    currency: "USD",
    rawText: "Sample scanner test mode result",
    warnings: [],
    items: [
      {
        name: "Avocado",
        normalizedName: "Avocado",
        quantity: 2,
        unit: "item",
        price: null,
        brand: null,
        category: "плодове",
        shelfLifeDays: 5,
        expirationDate: toDateInputValue(addDaysToDate(today, 5)),
        storageLocation: "хладилник",
        confidence: 0.92,
        selected: true,
      },
      {
        name: "Greek yogurt",
        normalizedName: "Greek yogurt",
        quantity: 1,
        unit: "tub",
        price: null,
        brand: null,
        category: "млечни",
        shelfLifeDays: 10,
        expirationDate: toDateInputValue(addDaysToDate(today, 10)),
        storageLocation: "хладилник",
        confidence: 0.88,
        selected: true,
      },
      {
        name: "Salmon fillet",
        normalizedName: "Salmon fillet",
        quantity: 1,
        unit: "pack",
        price: null,
        brand: null,
        category: "месо",
        shelfLifeDays: 2,
        expirationDate: toDateInputValue(addDaysToDate(today, 2)),
        storageLocation: "хладилник",
        confidence: 0.84,
        selected: true,
      },
    ],
  };
}

export function createSampleReceiptResult(): ParsedReceipt {
  const today = new Date();

  return {
    storeName: "Sample Market",
    purchaseDate: toDateInputValue(today),
    total: 18.47,
    currency: "USD",
    rawText: "SAMPLE MARKET\nBANANAS 1.20\nMILK 3.49\nBREAD 4.25\nTOTAL 18.47",
    warnings: [],
    items: [
      {
        name: "Bananas",
        normalizedName: "Bananas",
        quantity: 1,
        unit: "bunch",
        price: 1.2,
        brand: null,
        category: "плодове",
        shelfLifeDays: 5,
        expirationDate: toDateInputValue(addDaysToDate(today, 5)),
        storageLocation: "хладилник",
        confidence: 0.9,
        selected: true,
      },
      {
        name: "Milk",
        normalizedName: "Milk",
        quantity: 1,
        unit: "carton",
        price: 3.49,
        brand: null,
        category: "млечни",
        shelfLifeDays: 10,
        expirationDate: toDateInputValue(addDaysToDate(today, 10)),
        storageLocation: "хладилник",
        confidence: 0.88,
        selected: true,
      },
      {
        name: "Bread",
        normalizedName: "Bread",
        quantity: 1,
        unit: "loaf",
        price: 4.25,
        brand: null,
        category: "зърнени",
        shelfLifeDays: 5,
        expirationDate: toDateInputValue(addDaysToDate(today, 5)),
        storageLocation: "шкаф",
        confidence: 0.86,
        selected: true,
      },
    ],
  };
}

export function createSampleBarcodeResult(): BarcodeLookupResult {
  return {
    found: true,
    providersTried: ["local_cache"],
    duplicates: [],
    warnings: [],
    product: {
      barcode: "000000000000",
      name: "Sample oatmeal",
      brand: "WasteLessAI Demo",
      category: "зърнени",
      quantity: "1",
      unit: "box",
      imageUrl: null,
      ingredients: "Rolled oats",
      servingSize: "40 g",
      nutrition: {},
      shelfLifeDays: 180,
      storageLocation: "шкаф",
      source: "local_cache",
      confidence: 1,
    },
  };
}
