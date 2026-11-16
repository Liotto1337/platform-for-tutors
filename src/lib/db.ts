import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const cache = globalThis as typeof globalThis & { historyDb?: PrismaClient };

export const db = cache.historyDb ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
if (process.env.NODE_ENV !== "production") cache.historyDb = db;
