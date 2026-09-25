import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const DEFAULT_SUPABASE_URL =
  "postgresql://postgres.icgcictanniptpexanmp:Acalderon1%3Fdevio@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString =
      process.env.DATABASE_URL || process.env.DIRECT_URL || DEFAULT_SUPABASE_URL;

    const isRemote =
      connectionString.includes("supabase.com") ||
      connectionString.includes("pooler") ||
      connectionString.includes("aws-0") ||
      connectionString.includes("sslmode=require");

    const pool = new pg.Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
