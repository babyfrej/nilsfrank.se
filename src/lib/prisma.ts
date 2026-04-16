import { PrismaClient } from "./prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import assert from "assert";
//import "server-only";

const globalPrisma = global as unknown as {
  prisma: PrismaClient;
};

let prisma: PrismaClient;

if (process.env.APP_ENV === "production") {
  assert(process.env.DATABASE_AUTH_TOKEN, "missing auth token");
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  });
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalPrisma.prisma) {
    const adapter = new PrismaLibSql({
      url: process.env.DATABASE_URL,
    });
    globalPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalPrisma.prisma;
}

export default prisma;
