import 'dotenv/config';

import prisma from '../config/database';

async function main() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    process.stdout.write('ok\n');
    process.exit(0);
  } catch (err) {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
    process.stderr.write('unavailable\n');
    process.exit(1);
  }
}

void main();
