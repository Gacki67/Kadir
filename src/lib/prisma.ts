import { PrismaClient } from "@prisma/client";

/**
 * Instance Prisma partagee.
 * En developpement, Next.js recharge les modules a chaque modification : on
 * memorise le client sur l'objet global pour eviter d'ouvrir des dizaines de
 * connexions a la base.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
