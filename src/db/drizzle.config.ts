import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USERNAME || "admin",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "database",
    port: Number(process.env.DB_PORT) || 3306,
  },
  verbose: true,
  strict: true,
});
