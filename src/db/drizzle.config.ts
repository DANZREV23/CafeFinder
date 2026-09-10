import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.SQL_HOST || "localhost",
    user: process.env.SQL_USER || "admin",
    password: process.env.SQL_PASSWORD || "password",
    database: process.env.SQL_DB_NAME || "database",
    ssl: false,
  },
  verbose: true,
  strict: true,
});
