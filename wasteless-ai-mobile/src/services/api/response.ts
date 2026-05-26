import { ApiError } from './client';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getResponseError(payload: unknown) {
  if (!isRecord(payload) || payload.success !== false) return null;

  return typeof payload.error === 'string' ? payload.error : 'Request failed.';
}

export function getSuccessData(payload: unknown, invalidMessage: string) {
  const responseError = getResponseError(payload);
  if (responseError) {
    throw new ApiError(responseError, 0);
  }

  if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
    throw new ApiError(invalidMessage, 0);
  }

  return payload.data;
}

export function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function readNullableString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function readNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

export function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
