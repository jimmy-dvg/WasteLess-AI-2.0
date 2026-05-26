import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { databaseEnv } from "@/env/server";

const pool = new Pool({ connectionString: databaseEnv().DATABASE_URL });

export const db = drizzle(pool);
