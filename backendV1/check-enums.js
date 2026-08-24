import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'PassStatus'");
  console.log(result);
}

main().finally(() => prisma.$disconnect());
