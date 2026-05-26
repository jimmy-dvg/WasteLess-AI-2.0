import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { databaseEnv } from "@/env/server";

function createDb() {
  const pool = new Pool({ connectionString: databaseEnv().DATABASE_URL });
  return drizzle(pool);
}

type DatabaseClient = ReturnType<typeof createDb>;

let cachedDb: DatabaseClient | null = null;

export function getDb() {
  cachedDb ??= createDb();
  return cachedDb;
}

export const db = new Proxy({} as DatabaseClient, {
  get(_target, property, receiver) {
    const client = getDb();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
