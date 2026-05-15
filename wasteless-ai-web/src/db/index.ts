import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { createPool } from "pg";

const connectionString = process.env.DATABASE_URL as string;
const pool = createPool({ connectionString });

export const db = drizzle(pool);
