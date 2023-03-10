import { PrismaClient } from "@prisma/client";
import { config } from "./config";

let dbClient: PrismaClient;

export const getDatabaseClient = async () => {
  if (dbClient) {
    return dbClient;
  }

  dbClient = new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });

  await dbClient.$connect();

  return dbClient;
};
