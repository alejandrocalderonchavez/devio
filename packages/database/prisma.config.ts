import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma Client generation must also work before local secrets exist.
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/devio",
  },
});
