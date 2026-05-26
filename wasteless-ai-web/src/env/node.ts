import dotenv from "dotenv";

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

dotenv.config();

export function databaseEnv() {
  return parseEnv(databaseEnvSchema, process.env, { scope: "database" });
}

export function authEnv() {
  return parseEnv(authEnvSchema, process.env, { scope: "auth" });
}

export function apiEnv() {
  return parseEnv(apiEnvSchema, process.env, { scope: "api" });
}

export function appEnv() {
  return parseEnv(appEnvSchema, process.env, { scope: "app" });
}

export function aiEnv() {
  return parseEnv(aiEnvSchema, process.env, { scope: "ai" });
}

export function storageEnv() {
  return parseEnv(storageEnvSchema, process.env, { scope: "storage" });
}

export function scannerEnv() {
  return parseEnv(scannerEnvSchema, process.env, { scope: "scanner" });
}

export function notificationEnv() {
  return parseEnv(notificationEnvSchema, process.env, { scope: "notifications" });
}
