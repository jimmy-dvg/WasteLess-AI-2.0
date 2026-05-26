import type { Config } from "drizzle-kit";

import { databaseEnv } from "./src/env/node";

const env = databaseEnv();

const config: Config = {
  schema: ["./src/db/schema"],
  out: "./drizzle",
  
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
};

export default config;

