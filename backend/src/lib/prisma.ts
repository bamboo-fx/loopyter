import { PrismaClient } from "@prisma/client";

// Create a fresh Prisma client instance
// In development, we use a global variable to preserve the connection across hot reloads
// but we need to make sure it picks up schema changes

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient();
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
