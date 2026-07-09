import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Some managed Postgres providers (e.g. Render) use self-signed TLS certs that
// node-postgres rejects by default. Set DATABASE_SSL_NO_VERIFY=true in the
// hosting environment to accept them. Never enable this without a clear reason.
const sslConfig = process.env.DATABASE_SSL_NO_VERIFY === "true"
  ? { ssl: { rejectUnauthorized: false } }
  : {};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...sslConfig,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
