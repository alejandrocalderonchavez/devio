import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

export * from "@prisma/client";

const DEFAULT_SUPABASE_URL =
  "postgresql://postgres.icgcictanniptpexanmp:Acalderon1%3Fdevio@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

const connectionString =
  process.env.DATABASE_URL || process.env.DIRECT_URL || DEFAULT_SUPABASE_URL;

const isRemote =
  connectionString.includes("supabase.com") ||
  connectionString.includes("pooler") ||
  connectionString.includes("aws-0");

const pool = new pg.Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

