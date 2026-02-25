import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';

import { ROLES } from '../src/constants/roles';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin user...');

  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@monad.com';
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';
  const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE ?? '+233123456789';
  const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  let clerkUser: any;

  try {
    const existingUsers = await clerkClient.users.getUserList({ emailAddress: [ADMIN_EMAIL] });

    if (existingUsers.length > 0) {
      clerkUser = existingUsers[0];
      console.log('Clerk user already exists, using existing:', clerkUser.id);
    } else {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [ADMIN_EMAIL],
        password: ADMIN_PASSWORD,
        firstName: ADMIN_NAME.split(' ')[0],
        lastName: ADMIN_NAME.split(' ').slice(1).join(' ') || undefined,
        publicMetadata: { role: ROLES.ADMIN },
      });

      console.log('Clerk user created:', clerkUser.id);
    }
  } catch (error) {
    console.error('Error with Clerk user:', error);
    process.exit(1);
  }

  const adminRole = await prisma.role.upsert({
    where: { name: ROLES.ADMIN },
    update: {},
    create: { name: ROLES.ADMIN },
  });

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      fullName: ADMIN_NAME,
    },
    create: {
      clerkId: clerkUser.id,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      fullName: ADMIN_NAME,
      creditScore: 0,
      isBlocked: false,
    },
  });

  console.log('Database user record:', user.id);

  const existingUserRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: adminRole.id,
    },
    select: { id: true },
  });

  if (!existingUserRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log('Admin user seeded successfully!');
  console.log('Email:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
  console.log('Please change the password after first login.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
