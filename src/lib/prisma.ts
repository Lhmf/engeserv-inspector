import { PrismaClient } from "@prisma/client";

// Singleton do Prisma Client. Evita esgotar conexoes em dev (hot reload)
// e e reutilizado por toda a aplicacao. Nenhuma tela deve importar
// @prisma/client diretamente - sempre passar por este arquivo.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
