import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js uses .env.local; load it explicitly for the Prisma CLI.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" }); // fallback

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Check .env.local in the softrent/ folder."
  );
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  async adapter() {
    return new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
  },
});
