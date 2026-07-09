import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const needsSsl =
  process.env.NODE_ENV === "production" ||
  process.env.DATABASE_URL.includes("sslmode=require");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ...(needsSsl ? { ssl: true } : {}),
  },
});
