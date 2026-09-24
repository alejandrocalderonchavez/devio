import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

export * from "@prisma/client";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/devio?schema=public";

const isRemote = connectionString.includes("supabase.com") || connectionString.includes("pooler");

const pool = new pg.Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

