import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Render (and many hosted Postgres providers) require SSL.
// rejectUnauthorized:false handles self-signed certs on free-tier hosts.
const needsSsl =
  process.env.NODE_ENV === "production" ||
  process.env.DATABASE_URL.includes("sslmode=require");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
