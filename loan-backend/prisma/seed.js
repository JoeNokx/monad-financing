"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const roles_1 = require("../src/constants/roles");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding admin user...');
    const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@monad.com';
    const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';
    const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE ?? '+233123456789';
    const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Super Admin';
    let clerkUser;
    try {
        const existingUsers = await clerk_sdk_node_1.clerkClient.users.getUserList({ emailAddress: [ADMIN_EMAIL] });
        if (existingUsers.length > 0) {
            clerkUser = existingUsers[0];
            console.log('Clerk user already exists, using existing:', clerkUser.id);
        }
        else {
            clerkUser = await clerk_sdk_node_1.clerkClient.users.createUser({
                emailAddress: [ADMIN_EMAIL],
                password: ADMIN_PASSWORD,
                firstName: ADMIN_NAME.split(' ')[0],
                lastName: ADMIN_NAME.split(' ').slice(1).join(' ') || undefined,
                publicMetadata: { role: roles_1.ROLES.ADMIN },
            });
            console.log('Clerk user created:', clerkUser.id);
        }
    }
    catch (error) {
        console.error('Error with Clerk user:', error);
        process.exit(1);
    }
    const adminRole = await prisma.role.upsert({
        where: { name: roles_1.ROLES.ADMIN },
        update: {},
        create: { name: roles_1.ROLES.ADMIN },
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
