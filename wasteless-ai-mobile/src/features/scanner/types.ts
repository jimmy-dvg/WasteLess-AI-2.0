export type ScanMode = 'product' | 'receipt';

export type ScannerImage = {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

export type ScannerImageSource = 'camera' | 'gallery';

export type ScannerRequestPayload = {
  mode: ScanMode;
  image: ScannerImage;
};

export type RecognizedInventoryItemSource = 'product-image' | 'receipt';

export type RecognizedInventoryItem = {
  clientId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  categoryId?: string | null;
  storageZone?: string;
  expirationDate?: string | null;
  confidence?: number;
  source: RecognizedInventoryItemSource;
  selected: boolean;
};

export type RecognizedProductItem = RecognizedInventoryItem & {
  source: 'product-image';
};

export type RecognizedReceiptItem = RecognizedInventoryItem & {
  source: 'receipt';
  price?: number | null;
  brand?: string | null;
};

export type ScannerResult = {
  mode: ScanMode;
  items: (RecognizedProductItem | RecognizedReceiptItem)[];
  confidence?: number;
  warnings?: string[];
  receiptId?: string | null;
  purchaseDate?: string | null;
};

export type ScannerError = {
  message: string;
  status?: number;
};

export type ScannerState = {
  mode: ScanMode;
  image: ScannerImage | null;
  result: ScannerResult | null;
  isCameraOpen: boolean;
  isProcessing: boolean;
  error: string | null;
  successMessage: string | null;
};
