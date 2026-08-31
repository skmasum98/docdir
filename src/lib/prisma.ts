import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export { Prisma };

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createPrismaClient(): PrismaClient {
  const host = getRequiredEnv("DATABASE_HOST");
  const port = Number(getRequiredEnv("DATABASE_PORT"));
  const user = getRequiredEnv("DATABASE_USER");
  const password = getRequiredEnv("DATABASE_PASSWORD");
  const database = getRequiredEnv("DATABASE_NAME");

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("DATABASE_PORT must be a valid port number");
  }

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
    {
      useTextProtocol: true,
    }
  );

  return new PrismaClient({
    adapter,
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}