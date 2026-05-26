import "server-only";

import {
  aiEnvSchema,
  apiEnvSchema,
  appEnvSchema,
  authEnvSchema,
  databaseEnvSchema,
  notificationEnvSchema,
  parseEnv,
  scannerEnvSchema,
  storageEnvSchema,
} from "./schema";

let cachedDatabaseEnv: ReturnType<typeof getDatabaseEnv> | null = null;
let cachedAuthEnv: ReturnType<typeof getAuthEnv> | null = null;
let cachedApiEnv: ReturnType<typeof getApiEnv> | null = null;
let cachedAppEnv: ReturnType<typeof getAppEnv> | null = null;
let cachedAiEnv: ReturnType<typeof getAiEnv> | null = null;
let cachedStorageEnv: ReturnType<typeof getStorageEnv> | null = null;
let cachedScannerEnv: ReturnType<typeof getScannerEnv> | null = null;
let cachedNotificationEnv: ReturnType<typeof getNotificationEnv> | null = null;

export function getDatabaseEnv() {
  return parseEnv(databaseEnvSchema, process.env, { scope: "database" });
}

export function getAuthEnv() {
  return parseEnv(authEnvSchema, process.env, { scope: "auth" });
}

export function getApiEnv() {
  return parseEnv(apiEnvSchema, process.env, { scope: "api" });
}

export function getAppEnv() {
  return parseEnv(appEnvSchema, process.env, { scope: "app" });
}

export function getAiEnv() {
  return parseEnv(aiEnvSchema, process.env, { scope: "ai" });
}

export function getStorageEnv() {
  return parseEnv(storageEnvSchema, process.env, { scope: "storage" });
}

export function getScannerEnv() {
  return parseEnv(scannerEnvSchema, process.env, { scope: "scanner" });
}

export function getNotificationEnv() {
  return parseEnv(notificationEnvSchema, process.env, { scope: "notifications" });
}

export function databaseEnv() {
  cachedDatabaseEnv ??= getDatabaseEnv();
  return cachedDatabaseEnv;
}

export function authEnv() {
  cachedAuthEnv ??= getAuthEnv();
  return cachedAuthEnv;
}

export function apiEnv() {
  cachedApiEnv ??= getApiEnv();
  return cachedApiEnv;
}

export function appEnv() {
  cachedAppEnv ??= getAppEnv();
  return cachedAppEnv;
}

export function aiEnv() {
  cachedAiEnv ??= getAiEnv();
  return cachedAiEnv;
}

export function storageEnv() {
  cachedStorageEnv ??= getStorageEnv();
  return cachedStorageEnv;
}

export function scannerEnv() {
  cachedScannerEnv ??= getScannerEnv();
  return cachedScannerEnv;
}

export function notificationEnv() {
  cachedNotificationEnv ??= getNotificationEnv();
  return cachedNotificationEnv;
}
