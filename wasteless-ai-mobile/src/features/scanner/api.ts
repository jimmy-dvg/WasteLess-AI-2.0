import { Platform } from 'react-native';

import { API_ENDPOINTS } from '@/services/api/endpoints';
import { ApiError, apiRequest } from '@/services/api/client';
import type {
  RecognizedProductItem,
  RecognizedReceiptItem,
  ScannerImage,
  ScannerRequestPayload,
  ScannerResult,
  ScanMode,
} from './types';

const MAX_SCANNER_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];
type RecognizedScannerItem = RecognizedProductItem | RecognizedReceiptItem;

type ReactNativeImageFile = {
  uri: string;
  name: string;
  type: SupportedImageType;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readNullableString(value: unknown) {
  const text = readString(value);
  return text.length > 0 ? text : null;
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readDate(value: unknown) {
  const text = readNullableString(value);
  if (!text) return null;

  const isoDate = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return isoDate ?? text.slice(0, 32);
}

function readWarnings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map(readNullableString)
    .filter((warning): warning is string => Boolean(warning));
}

function uniqueWarnings(warnings: string[]) {
  return Array.from(new Set(warnings.filter(Boolean)));
}

function normalizeMimeType(value?: string) {
  const mimeType = value?.trim().toLowerCase();
  if (!mimeType) return null;
  if (mimeType === 'image/jpg') return 'image/jpeg';
  return mimeType;
}

function isSupportedImageType(value: string): value is SupportedImageType {
  return SUPPORTED_IMAGE_TYPES.includes(value as SupportedImageType);
}

function inferMimeTypeFromName(value?: string) {
  const name = value?.toLowerCase() ?? '';
  if (name.endsWith('.png')) return 'image/png' satisfies SupportedImageType;
  if (name.endsWith('.webp')) return 'image/webp' satisfies SupportedImageType;
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg' satisfies SupportedImageType;
  return 'image/jpeg' satisfies SupportedImageType;
}

function getImageMimeType(image: ScannerImage): SupportedImageType {
  const normalized = normalizeMimeType(image.mimeType);

  if (normalized) {
    if (isSupportedImageType(normalized)) return normalized;
    throw new ApiError('Choose a JPEG, PNG, or WebP image.', 0);
  }

  return inferMimeTypeFromName(image.fileName ?? image.uri);
}

function getExtension(mimeType: SupportedImageType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function getSafeFileName(image: ScannerImage, mode: ScanMode, mimeType: SupportedImageType) {
  const rawName = image.fileName?.split(/[\\/]/).pop();
  const sanitized = rawName
    ?.replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80);

  return `${sanitized || `${mode}-scan`}.${getExtension(mimeType)}`;
}

async function appendImage(formData: FormData, image: ScannerImage, mode: ScanMode) {
  if (image.fileSize != null && image.fileSize > MAX_SCANNER_IMAGE_BYTES) {
    throw new ApiError('Image must be 8 MB or smaller.', 0);
  }

  const mimeType = getImageMimeType(image);
  const fileName = getSafeFileName(image, mode, mimeType);

  if (Platform.OS === 'web') {
    const response = await fetch(image.uri);
    const blob = await response.blob();

    if (blob.size > MAX_SCANNER_IMAGE_BYTES) {
      throw new ApiError('Image must be 8 MB or smaller.', 0);
    }

    formData.append('image', blob, fileName);
    return;
  }

  const file: ReactNativeImageFile = {
    uri: image.uri,
    name: fileName,
    type: mimeType,
  };

  formData.append('image', file as unknown as Blob);
}

function getSuccessData(payload: unknown, invalidMessage: string) {
  if (isRecord(payload) && payload.success === false) {
    throw new ApiError(readNullableString(payload.error) ?? 'Scanner request failed.', 0);
  }

  if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
    throw new ApiError(invalidMessage, 0);
  }

  return payload.data;
}

function parseRecognizedItem(
  value: unknown,
  mode: ScanMode,
  index: number,
): RecognizedScannerItem | null {
  if (!isRecord(value)) return null;

  const name =
    readNullableString(value.name) ??
    readNullableString(value.normalizedName) ??
    readNullableString(value.normalized_name);

  if (!name) return null;

  const confidence = readNumber(value.confidence);
  const quantity = readNumber(value.quantity) ?? 1;
  const common = {
    clientId: `${mode}-${index}`,
    name,
    quantity,
    unit: readNullableString(value.unit) ?? undefined,
    category: readNullableString(value.category) ?? undefined,
    storageZone:
      readNullableString(value.storageZone) ??
      readNullableString(value.storageLocation) ??
      readNullableString(value.storage_location) ??
      undefined,
    expirationDate:
      readDate(value.expirationDate) ??
      readDate(value.expiration_date) ??
      readDate(value.bestBefore) ??
      readDate(value.best_before),
    confidence:
      confidence == null ? undefined : Math.max(0, Math.min(1, confidence > 1 ? confidence / 100 : confidence)),
    selected: value.selected !== false,
  };

  if (mode === 'receipt') {
    return {
      ...common,
      source: 'receipt',
      price: readNumber(value.price),
      brand: readNullableString(value.brand),
    };
  }

  return {
    ...common,
    source: 'product-image',
  };
}

function getAverageConfidence(items: RecognizedScannerItem[], fallback: unknown) {
  const fallbackConfidence = readNumber(fallback);
  const confidences = items
    .map((item) => item.confidence)
    .filter((confidence): confidence is number => typeof confidence === 'number');

  if (confidences.length === 0) {
    return fallbackConfidence == null ? undefined : Math.max(0, Math.min(1, fallbackConfidence));
  }

  return confidences.reduce((total, confidence) => total + confidence, 0) / confidences.length;
}

function parseScannerResponse(payload: unknown, mode: ScanMode): ScannerResult {
  const data = getSuccessData(payload, 'Invalid scanner response from server.');
  const record = isRecord(data) ? data : {};
  const parsedReceipt = isRecord(record.parsedReceipt) ? record.parsedReceipt : null;
  const ocr = isRecord(record.ocr) ? record.ocr : null;
  const rawItems = Array.isArray(parsedReceipt?.items) ? parsedReceipt.items : [];
  const items = rawItems
    .map((item, index) => parseRecognizedItem(item, mode, index))
    .filter((item): item is RecognizedScannerItem => Boolean(item));

  const warnings = uniqueWarnings([
    ...readWarnings(record.warnings),
    ...readWarnings(parsedReceipt?.warnings),
    ...readWarnings(ocr?.warnings),
    ...(parsedReceipt ? [] : ['Scanner response was incomplete. Try again with a clearer image.']),
    ...(items.length > 0 ? [] : ['No inventory items were recognized.']),
  ]);

  return {
    mode,
    items,
    confidence: getAverageConfidence(items, ocr?.confidence),
    warnings,
    receiptId: readNullableString(record.receiptId),
    purchaseDate: readDate(parsedReceipt?.purchaseDate),
  };
}

async function postScannerImage(
  token: string,
  endpoint: string,
  payload: ScannerRequestPayload,
  extraFields: Record<string, string> = {},
) {
  const formData = new FormData();
  await appendImage(formData, payload.image, payload.mode);

  Object.entries(extraFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return apiRequest<unknown>(endpoint, {
    authToken: token,
    body: formData,
    contentType: 'form-data',
    method: 'POST',
  });
}

export async function scanProductImage(
  token: string,
  payload: ScannerRequestPayload,
): Promise<ScannerResult> {
  const response = await postScannerImage(token, API_ENDPOINTS.scanner.product, payload, {
    mode: 'food_photo',
  });

  return parseScannerResponse(response, 'product');
}

export async function scanReceiptImage(
  token: string,
  payload: ScannerRequestPayload,
): Promise<ScannerResult> {
  const response = await postScannerImage(token, API_ENDPOINTS.scanner.receipt, payload);

  return parseScannerResponse(response, 'receipt');
}

export async function scanImage(token: string, payload: ScannerRequestPayload) {
  return payload.mode === 'product'
    ? scanProductImage(token, payload)
    : scanReceiptImage(token, payload);
}
