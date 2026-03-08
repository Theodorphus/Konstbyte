import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // allow global across hot reloads in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = global.prisma ?? createPrisma();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
