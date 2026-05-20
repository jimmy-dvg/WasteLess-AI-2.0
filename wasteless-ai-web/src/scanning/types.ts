export type ScanType = "barcode" | "receipt" | "food_photo" | "shelf_photo" | "fridge_photo";

export type ScanStatus = "processed" | "partial" | "failed";

export type SupportedBarcodeFormat = "EAN_13" | "UPC_A" | "UPC_E" | "QR_CODE" | "CODE_128";

export type BarcodeProviderId = "local_cache" | "open_food_facts" | "usda_fdc" | "barcode_lookup";

export type BarcodeScanInput = {
  barcode: string;
  format?: SupportedBarcodeFormat | string | null;
};

export type BarcodeProductMetadata = {
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  quantity: string | null;
  unit: string | null;
  imageUrl: string | null;
  ingredients: string | null;
  servingSize: string | null;
  nutrition: Record<string, unknown>;
  shelfLifeDays: number | null;
  storageLocation: string | null;
  source: BarcodeProviderId;
  confidence: number;
  raw?: unknown;
};

export type BarcodeLookupResult = {
  found: boolean;
  product: BarcodeProductMetadata | null;
  providersTried: BarcodeProviderId[];
  duplicates: ScannedProductDuplicate[];
  warnings: string[];
};

export type ScannedProductDuplicate = {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  expirationDate: Date | null;
  storageLocation: string | null;
};

export type OCRBoundingBox = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type OCRLine = {
  text: string;
  confidence: number;
  bbox?: OCRBoundingBox | null;
};

export type OCRResult = {
  rawText: string;
  confidence: number;
  lines: OCRLine[];
  engine: "tesseract.js";
  processedAt: string;
  warnings: string[];
};

export type ReceiptItemExtraction = {
  id?: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string | null;
  price: number | null;
  brand: string | null;
  category: string | null;
  shelfLifeDays: number | null;
  expirationDate: string | null;
  storageLocation: string | null;
  confidence: number;
  selected?: boolean;
};

export type ParsedReceipt = {
  storeName: string | null;
  purchaseDate: string | null;
  total: number | null;
  currency: string | null;
  items: ReceiptItemExtraction[];
  rawText: string;
  warnings: string[];
};

export type PhotoScanMode = "food_photo" | "shelf_photo" | "fridge_photo";

export type PhotoRecognitionResult = {
  mode: PhotoScanMode;
  imageUrl: string | null;
  parsedReceipt: ParsedReceipt;
  warnings: string[];
};

export type ScanHistoryItem = {
  id: string;
  type: ScanType | string;
  barcode: string | null;
  symbology: string | null;
  rawText: string | null;
  status: ScanStatus | string;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export type ScannedReceiptRecord = {
  id: string;
  imageUrl: string | null;
  rawText: string | null;
  extractedData: ParsedReceipt | Record<string, unknown>;
  status: ScanStatus | string;
  processedAt: Date;
  createdAt: Date;
};

export type ImportReceiptItemInput = ReceiptItemExtraction & {
  categoryId?: string | null;
  notes?: string | null;
};

export type ImportReceiptItemsResult = {
  importedCount: number;
  productIds: string[];
  skippedCount: number;
  batchId: string | null;
};

export type ScanImportBatch = {
  id: string;
  source: ScanType | string;
  receiptId: string | null;
  productIds: string[];
  importedCount: number;
  status: "active" | "reverted" | string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  revertedAt: Date | null;
};

export type ScannerDiagnosticStatus = "ready" | "warning" | "missing";

export type ScannerDiagnosticItem = {
  id: string;
  label: string;
  status: ScannerDiagnosticStatus;
  message: string;
  optional: boolean;
};

export type ScannerDiagnostics = {
  overallStatus: ScannerDiagnosticStatus;
  photoRecognitionProvider: "auto" | "openai" | "gemini";
  items: ScannerDiagnosticItem[];
};
