import { defineConfig } from "drizzle-kit";
import { fileURLToPath } from "url";
import path from "path";

// In ESM modules __dirname is not available — derive it from import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ...(process.env.DATABASE_SSL_NO_VERIFY === "true" ? { ssl: true } : {}),
  },
});
