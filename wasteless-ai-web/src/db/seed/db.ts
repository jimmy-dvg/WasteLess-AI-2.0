import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema/tables";

const connectionString = process.env.DATABASE_URL as string;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env file");
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export async function closeDB() {
  await pool.end();
}


