import { API_ENDPOINTS } from '@/services/api/endpoints';
import { ApiError, apiRequest } from '@/services/api/client';
import type {
  NotificationDigestFrequency,
  NotificationPreferences,
  PushTokenRegistrationPayload,
} from './types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getResponseError(payload: unknown) {
  if (!isRecord(payload) || payload.success !== false) return null;

  return typeof payload.error === 'string' ? payload.error : 'Request failed.';
}

function getSuccessData(payload: unknown, invalidMessage: string) {
  const responseError = getResponseError(payload);
  if (responseError) {
    throw new ApiError(responseError, 0);
  }

  if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
    throw new ApiError(invalidMessage, 0);
  }

  return payload.data;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function readReminderTime(value: unknown, fallback: string) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback;
}

function readDigestFrequency(value: unknown, fallback: NotificationDigestFrequency) {
  return value === 'off' || value === 'daily' || value === 'weekly' ? value : fallback;
}

function parseNotificationPreferences(value: unknown): NotificationPreferences {
  const record = isRecord(value) ? value : {};
  const defaults = DEFAULT_NOTIFICATION_PREFERENCES;

  return {
    expirationReminders: readBoolean(record.expirationReminders, defaults.expirationReminders),
    expiredItemReminders: readBoolean(record.expiredItemReminders, defaults.expiredItemReminders),
    lowStockReminders: readBoolean(record.lowStockReminders, defaults.lowStockReminders),
    useTodayAlerts: readBoolean(record.useTodayAlerts, defaults.useTodayAlerts),
    mealPlanReminders: readBoolean(record.mealPlanReminders, defaults.mealPlanReminders),
    shoppingReminders: readBoolean(record.shoppingReminders, defaults.shoppingReminders),
    digestFrequency: readDigestFrequency(record.digestFrequency, defaults.digestFrequency),
    emailNotifications: readBoolean(record.emailNotifications, defaults.emailNotifications),
    webPushNotifications: readBoolean(record.webPushNotifications, defaults.webPushNotifications),
    expoPushNotifications: readBoolean(record.expoPushNotifications, defaults.expoPushNotifications),
    expirationWindowDays: readNumber(record.expirationWindowDays, defaults.expirationWindowDays),
    reminderTime: readReminderTime(record.reminderTime, defaults.reminderTime),
  };
}

function parsePreferencesResponse(payload: unknown): NotificationPreferences {
  const data = getSuccessData(payload, 'Invalid notification preferences response from server.');
  if (!isRecord(data)) {
    throw new ApiError('Invalid notification preferences response from server.', 0);
  }

  return parseNotificationPreferences(data.settings);
}

function toPreferencesPayload(preferences: NotificationPreferences) {
  return {
    ...preferences,
    expirationWindowDays: Math.max(1, Math.min(14, Math.trunc(preferences.expirationWindowDays))),
    reminderTime: readReminderTime(preferences.reminderTime, DEFAULT_NOTIFICATION_PREFERENCES.reminderTime),
  };
}

export async function getNotificationPreferences(token: string) {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.notifications.preferences, {
    authToken: token,
  });

  return parsePreferencesResponse(payload);
}

export async function updateNotificationPreferences(
  token: string,
  preferences: NotificationPreferences,
) {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.notifications.preferences, {
    authToken: token,
    method: 'PATCH',
    body: JSON.stringify(toPreferencesPayload(preferences)),
  });

  return parsePreferencesResponse(payload);
}

export async function registerNotificationPushToken(
  token: string,
  payload: PushTokenRegistrationPayload,
) {
  await apiRequest<unknown>(API_ENDPOINTS.notifications.pushToken, {
    authToken: token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unregisterNotificationPushToken(
  token: string,
  payload: { expoPushToken?: string | null; deviceId?: string | null },
) {
  await apiRequest<unknown>(API_ENDPOINTS.notifications.pushToken, {
    authToken: token,
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}
