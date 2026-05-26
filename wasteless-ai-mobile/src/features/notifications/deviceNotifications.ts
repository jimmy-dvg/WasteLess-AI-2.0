import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { defaultInventoryFilters, listInventoryItems } from '@/features/inventory/api';
import type { InventoryItem } from '@/features/inventory/types';
import { listShoppingItems } from '@/features/shopping/api';
import type { ShoppingListItem } from '@/features/shopping/types';
import {
  getNotificationPreferences,
  registerNotificationPushToken,
  unregisterNotificationPushToken,
} from './api';
import type {
  NotificationPermissionState,
  NotificationPreferences,
  PushRegistrationResult,
  PushTokenRegistrationPayload,
} from './types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './types';

const LOCAL_REMINDER_OWNER = 'wastelessai.local-reminder';
const REMINDER_CHANNEL_ID = 'reminders';
const DEVICE_ID_STORAGE_KEY = 'wastelessai.notificationDeviceId';
const PUSH_TOKEN_STORAGE_KEY = 'wastelessai.expoPushToken';
const MAX_LOCAL_ITEM_REMINDERS = 32;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type ReminderKind = 'expiring-soon' | 'expires-today' | 'expired' | 'low-stock' | 'shopping-list';

type LocalReminderRequest = {
  identifier: string;
  title: string;
  body: string;
  date: Date;
  data: {
    owner: string;
    key: string;
    kind: ReminderKind;
    itemId?: string;
  };
};

type ReminderSourceUpdate = {
  inventoryItems?: InventoryItem[];
  shoppingItems?: ShoppingListItem[];
};

let notificationHandlerConfigured = false;
let latestPreferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
let latestInventoryItems: InventoryItem[] = [];
let latestShoppingItems: ShoppingListItem[] = [];
let schedulePromise: Promise<void> | null = null;
let schedulePending = false;

function isNativePlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function getWebStorage() {
  if (Platform.OS !== 'web') return null;
  if (typeof globalThis.localStorage === 'undefined') return null;

  return globalThis.localStorage;
}

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function getStoredValue(key: string) {
  if (Platform.OS === 'web') {
    try {
      return getWebStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  if (!(await isSecureStoreAvailable())) return null;

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }

  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
  }
}

async function clearStoredValue(key: string) {
  if (Platform.OS === 'web') {
    try {
      getWebStorage()?.removeItem(key);
    } catch {
      // Best-effort cleanup.
    }
    return;
  }

  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
  }
}

function createDeviceId() {
  return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function getOrCreateDeviceId() {
  const existing = await getStoredValue(DEVICE_ID_STORAGE_KEY);
  if (existing?.trim()) return existing;

  const next = createDeviceId();
  await setStoredValue(DEVICE_ID_STORAGE_KEY, next);
  return next;
}

function getDevicePlatform(): PushTokenRegistrationPayload['platform'] {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }

  return 'unknown';
}

function getProjectId() {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return Constants.easConfig?.projectId ?? extra?.eas?.projectId ?? null;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseExpirationDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return startOfLocalDay(date);
}

function parseReminderTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return { hour: 8, minute: 0 };

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function applyReminderTime(date: Date, reminderTime: string) {
  const { hour, minute } = parseReminderTime(reminderTime);
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function soonDate(minutesFromNow = 2) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

function getNextReminderDate(reminderTime: string, options: { urgent?: boolean } = {}) {
  const now = new Date();
  const todayAtReminderTime = applyReminderTime(now, reminderTime);

  if (todayAtReminderTime.getTime() > now.getTime() + 60 * 1000) {
    return todayAtReminderTime;
  }

  if (options.urgent) return soonDate();

  return applyReminderTime(addDays(now, 1), reminderTime);
}

function getDaysUntil(date: Date) {
  return Math.ceil((startOfLocalDay(date).getTime() - startOfLocalDay(new Date()).getTime()) / MS_PER_DAY);
}

function getQuantityLabel(item: InventoryItem) {
  return [item.quantity, item.unit].filter(Boolean).join(' ');
}

function makeIdentifier(key: string) {
  return `wla-${key}`.replace(/[^a-zA-Z0-9_.:-]/g, '-');
}

function buildReminderRequests(
  preferences: NotificationPreferences,
  inventoryItems: InventoryItem[],
  shoppingItems: ShoppingListItem[],
) {
  const requests: LocalReminderRequest[] = [];
  const seenKeys = new Set<string>();
  const sortedInventory = [...inventoryItems].sort((first, second) => {
    const firstDate = parseExpirationDate(first.expirationDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const secondDate = parseExpirationDate(second.expirationDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return firstDate - secondDate || first.name.localeCompare(second.name);
  });

  function addRequest(request: Omit<LocalReminderRequest, 'identifier'>) {
    if (requests.length >= MAX_LOCAL_ITEM_REMINDERS) return;
    if (seenKeys.has(request.data.key)) return;
    if (request.date.getTime() <= Date.now() + 30 * 1000) return;

    seenKeys.add(request.data.key);
    requests.push({
      ...request,
      identifier: makeIdentifier(request.data.key),
    });
  }

  for (const item of sortedInventory) {
    const expirationDate = parseExpirationDate(item.expirationDate);
    if (!expirationDate) continue;

    const daysUntil = getDaysUntil(expirationDate);
    const quantityLabel = getQuantityLabel(item);

    if (daysUntil < 0 && preferences.expiredItemReminders) {
      addRequest({
        title: `${item.name} is expired`,
        body: quantityLabel
          ? `${quantityLabel} expired. Check it before using it.`
          : 'Check it before using it.',
        date: getNextReminderDate(preferences.reminderTime),
        data: {
          owner: LOCAL_REMINDER_OWNER,
          key: `expired:${item.id}:${startOfLocalDay(new Date()).toISOString().slice(0, 10)}`,
          kind: 'expired',
          itemId: item.id,
        },
      });
      continue;
    }

    if (daysUntil === 0 && preferences.useTodayAlerts) {
      addRequest({
        title: `Use ${item.name} today`,
        body: `${item.name} expires today.`,
        date: getNextReminderDate(preferences.reminderTime, { urgent: true }),
        data: {
          owner: LOCAL_REMINDER_OWNER,
          key: `today:${item.id}:${expirationDate.toISOString().slice(0, 10)}`,
          kind: 'expires-today',
          itemId: item.id,
        },
      });
      continue;
    }

    if (daysUntil > 0 && preferences.expirationReminders) {
      const reminderDate =
        daysUntil <= preferences.expirationWindowDays
          ? getNextReminderDate(preferences.reminderTime, { urgent: true })
          : applyReminderTime(addDays(expirationDate, -preferences.expirationWindowDays), preferences.reminderTime);

      addRequest({
        title: `${item.name} expires soon`,
        body: `${item.name} expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`,
        date: reminderDate.getTime() > Date.now() ? reminderDate : soonDate(),
        data: {
          owner: LOCAL_REMINDER_OWNER,
          key: `expiring:${item.id}:${expirationDate.toISOString().slice(0, 10)}:${preferences.expirationWindowDays}`,
          kind: 'expiring-soon',
          itemId: item.id,
        },
      });
    }
  }

  if (preferences.lowStockReminders) {
    for (const item of sortedInventory.filter((inventoryItem) => inventoryItem.lowStock)) {
      const quantityLabel = getQuantityLabel(item);
      addRequest({
        title: `${item.name} is running low`,
        body: quantityLabel ? `${quantityLabel} remaining.` : 'Add it to your shopping list if needed.',
        date: getNextReminderDate(preferences.reminderTime),
        data: {
          owner: LOCAL_REMINDER_OWNER,
          key: `low-stock:${item.id}:${startOfLocalDay(new Date()).toISOString().slice(0, 10)}`,
          kind: 'low-stock',
          itemId: item.id,
        },
      });
    }
  }

  const uncheckedShoppingCount = shoppingItems.filter((item) => !item.checked).length;
  if (preferences.shoppingReminders && uncheckedShoppingCount > 0) {
    addRequest({
      title: `${uncheckedShoppingCount} shopping item${uncheckedShoppingCount === 1 ? '' : 's'} open`,
      body: 'Your shopping list still has unchecked items.',
      date: getNextReminderDate(preferences.reminderTime),
      data: {
        owner: LOCAL_REMINDER_OWNER,
        key: `shopping:${startOfLocalDay(new Date()).toISOString().slice(0, 10)}`,
        kind: 'shopping-list',
      },
    });
  }

  return requests;
}

function isWasteLessReminder(request: Notifications.NotificationRequest) {
  const data = request.content.data as Record<string, unknown> | null;
  return data?.owner === LOCAL_REMINDER_OWNER;
}

async function cancelWasteLessReminderNotifications() {
  if (!isNativePlatform()) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter(isWasteLessReminder)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

async function scheduleReminderRequests(requests: LocalReminderRequest[]) {
  await Promise.all(
    requests.map((request) =>
      Notifications.scheduleNotificationAsync({
        identifier: request.identifier,
        content: {
          title: request.title,
          body: request.body,
          data: request.data,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: request.date,
          channelId: REMINDER_CHANNEL_ID,
        },
      }),
    ),
  );
}

export async function configureNotificationHandling() {
  if (!isNativePlatform()) return;

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'WasteLessAI reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2F7D4B',
    });
  }
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (!isNativePlatform()) {
    return { granted: false, status: 'unsupported' };
  }

  const permissions = await Notifications.getPermissionsAsync();
  return {
    granted: permissions.granted || permissions.status === Notifications.PermissionStatus.GRANTED,
    status: permissions.status,
  };
}

export async function requestNotificationPermissions() {
  if (!isNativePlatform()) {
    return { granted: false, status: 'unsupported' };
  }

  await configureNotificationHandling();

  const existing = await getNotificationPermissionState();
  if (existing.granted) return existing;

  const requested = await Notifications.requestPermissionsAsync();
  const state = {
    granted: requested.granted || requested.status === Notifications.PermissionStatus.GRANTED,
    status: requested.status,
  };

  await scheduleLocalReminderNotifications();
  return state;
}

export async function scheduleLocalReminderNotifications() {
  if (!isNativePlatform()) return;

  if (schedulePromise) {
    schedulePending = true;
    return schedulePromise;
  }

  schedulePromise = (async () => {
    await configureNotificationHandling();

    const permission = await getNotificationPermissionState();
    if (!permission.granted) {
      await cancelWasteLessReminderNotifications();
      return;
    }

    const requests = buildReminderRequests(
      latestPreferences,
      latestInventoryItems,
      latestShoppingItems,
    );

    await cancelWasteLessReminderNotifications();
    await scheduleReminderRequests(requests);
  })().finally(() => {
    schedulePromise = null;
    if (schedulePending) {
      schedulePending = false;
      void scheduleLocalReminderNotifications();
    }
  });

  return schedulePromise;
}

export async function syncLocalReminderPreferences(preferences: NotificationPreferences) {
  latestPreferences = preferences;
  await scheduleLocalReminderNotifications();
}

export async function syncLocalReminderSources(update: ReminderSourceUpdate) {
  if (update.inventoryItems) latestInventoryItems = update.inventoryItems;
  if (update.shoppingItems) latestShoppingItems = update.shoppingItems;
  await scheduleLocalReminderNotifications();
}

export async function refreshNotificationReminders(token: string) {
  await configureNotificationHandling();

  const [preferences, inventoryData, shoppingData] = await Promise.all([
    getNotificationPreferences(token),
    listInventoryItems(token, { ...defaultInventoryFilters, pageSize: 50 }),
    listShoppingItems(token),
  ]);

  latestPreferences = preferences;
  latestInventoryItems = inventoryData.items;
  latestShoppingItems = shoppingData.items;

  await scheduleLocalReminderNotifications();

  const permission = await getNotificationPermissionState();
  if (permission.granted && preferences.expoPushNotifications) {
    await registerDeviceForPushNotifications(token).catch(() => null);
  }

  return preferences;
}

export async function clearLocalNotificationReminders() {
  latestInventoryItems = [];
  latestShoppingItems = [];
  await cancelWasteLessReminderNotifications();
}

export async function registerDeviceForPushNotifications(
  authToken: string,
): Promise<PushRegistrationResult> {
  if (!isNativePlatform()) {
    return {
      success: false,
      status: 'unsupported',
      message: 'Device notifications are available in the iOS and Android app.',
    };
  }

  await configureNotificationHandling();

  if (!Device.isDevice) {
    return {
      success: false,
      status: 'unsupported',
      message: 'Remote push requires a physical device.',
    };
  }

  const permission = await requestNotificationPermissions();
  if (!permission.granted) {
    return {
      success: false,
      status: 'permission-denied',
      message: 'Notification permission was not granted.',
    };
  }

  const projectId = getProjectId();
  if (!projectId) {
    await scheduleLocalReminderNotifications();
    return {
      success: false,
      status: 'unsupported',
      message: 'Local reminders are enabled. Add an EAS project id to register remote push tokens.',
    };
  }

  try {
    const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const deviceId = await getOrCreateDeviceId();
    await registerNotificationPushToken(authToken, {
      expoPushToken,
      deviceId,
      platform: getDevicePlatform(),
      deviceName: Device.deviceName ?? Device.modelName ?? null,
    });
    await setStoredValue(PUSH_TOKEN_STORAGE_KEY, expoPushToken);

    return {
      success: true,
      status: 'registered',
      message: 'Device notifications are enabled.',
      expoPushToken,
    };
  } catch {
    return {
      success: false,
      status: 'error',
      message: 'Unable to register this device for remote push right now.',
    };
  }
}

export async function unregisterDeviceForPushNotifications(authToken: string) {
  const [expoPushToken, deviceId] = await Promise.all([
    getStoredValue(PUSH_TOKEN_STORAGE_KEY),
    getStoredValue(DEVICE_ID_STORAGE_KEY),
  ]);

  if (!expoPushToken && !deviceId) return;

  await unregisterNotificationPushToken(authToken, { expoPushToken, deviceId }).catch(() => undefined);
  await clearStoredValue(PUSH_TOKEN_STORAGE_KEY);
}
