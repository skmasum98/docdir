import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export { Prisma };

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const host = process.env.DATABASE_HOST || "mysql.gb.stackcp.com";
  const port = parseInt(process.env.DATABASE_PORT || "42132", 10);
  const user = process.env.DATABASE_USER || "doctor_db_user";
  const password = process.env.DATABASE_PASSWORD || "lpl02751";
  const database = process.env.DATABASE_NAME || "doctor_directory-353131338c3f";

  const adapter = new PrismaMariaDb(
    {
      host,
      port,
      user,
      password,
      database,
      ssl: false,
      acquireTimeout: 10000,
      connectTimeout: 10000,
      connectionLimit: 10,
    },
    { useTextProtocol: true }
  );

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
