import { API_ENDPOINTS } from '@/services/api/endpoints';
import { apiRequest } from '@/services/api/client';
import {
  getSuccessData,
  isRecord,
  readNullableString,
  readNumber,
  readString,
} from '@/services/api/response';
import type { WasteLogEntry, WasteLogPayload, WastePageData, WasteReasonBreakdown } from './types';

function parseWasteLog(value: unknown): WasteLogEntry | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  if (!id) return null;

  return {
    id,
    productId: readNullableString(value.productId),
    productName: readString(value.productName, 'Deleted product'),
    categoryName: readString(value.categoryName, 'Uncategorized'),
    quantity: readString(value.quantity),
    unit: readNullableString(value.unit),
    quantityLabel: readString(value.quantityLabel),
    reason: readString(value.reason, 'other'),
    reasonLabel: readString(value.reasonLabel, 'Other'),
    notes: readNullableString(value.notes),
    createdAt: readString(value.createdAt),
  };
}

function parseReasonBreakdown(value: unknown): WasteReasonBreakdown | null {
  if (!isRecord(value)) return null;

  const reason = readString(value.reason);
  if (!reason) return null;

  return {
    reason,
    label: readString(value.label, 'Other'),
    count: readNumber(value.count),
  };
}

function parseWasteData(payload: unknown): WastePageData {
  const data = getSuccessData(payload, 'Invalid waste response from server.');
  if (!isRecord(data)) {
    throw new Error('Invalid waste response from server.');
  }

  const rawStats = isRecord(data.stats) ? data.stats : {};

  return {
    stats: {
      totalEvents: readNumber(rawStats.totalEvents),
      recentEvents: readNumber(rawStats.recentEvents),
      topReason: readString(rawStats.topReason, 'None yet'),
      preventedUpdates: readNumber(rawStats.preventedUpdates),
    },
    recentLogs: Array.isArray(data.recentLogs)
      ? data.recentLogs.map(parseWasteLog).filter((item): item is WasteLogEntry => Boolean(item))
      : [],
    reasonBreakdown: Array.isArray(data.reasonBreakdown)
      ? data.reasonBreakdown
          .map(parseReasonBreakdown)
          .filter((item): item is WasteReasonBreakdown => Boolean(item))
      : [],
  };
}

function parseLogWasteResponse(payload: unknown) {
  const data = getSuccessData(payload, 'Invalid waste log response from server.');
  if (!isRecord(data)) return 'Waste logged.';

  return readString(data.message, 'Waste logged.');
}

export async function getWasteData(token: string): Promise<WastePageData> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.waste.detail, {
    authToken: token,
  });

  return parseWasteData(payload);
}

export async function logWaste(token: string, log: WasteLogPayload): Promise<string> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.waste.create, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(log),
  });

  return parseLogWasteResponse(payload);
}
