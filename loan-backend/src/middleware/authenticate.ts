import type { RequestHandler } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import crypto from 'crypto';

import prisma from '../config/database';
import ApiError from '../common/errors/ApiError';
import logger from '../common/logger/logger';
import { env } from '../config/env';
import { ROLES } from '../constants/roles';

function generateReferralCode(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode(10);
    const existing = await prisma.user.findFirst({ where: { referralCode: code }, select: { id: true } });
    if (!existing) return code;
  }

  return `${generateReferralCode(8)}${Date.now().toString(36).toUpperCase().slice(-2)}`;
}

function unauthorized() {
  return new ApiError('Unauthorized', {
    statusCode: 401,
    code: 'UNAUTHORIZED',
  });
}

function parseBootstrapEmails(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isBootstrapSuperAdminEmail(email: string) {
  const allowlist = parseBootstrapEmails(env.INITIAL_SUPERADMIN_EMAILS);
  return allowlist.includes(email.trim().toLowerCase());
}

async function ensureUserHasRole(userId: string, roleName: string) {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName },
    select: { id: true },
  });

  const existing = await prisma.userRole.findFirst({ where: { userId, roleId: role.id }, select: { id: true } });
  if (existing) return;

  await prisma.userRole.create({
    data: {
      userId,
      roleId: role.id,
    },
  });
}

function missingPrimaryEmail() {
  return new ApiError('Clerk user is missing a primary email', {
    statusCode: 400,
    code: 'MISSING_EMAIL',
  });
}

function logMissingUserId(req: Parameters<RequestHandler>[0], auth: ReturnType<typeof getAuth>) {
  const authorization = req.headers.authorization;
  const scheme = authorization ? authorization.split(' ')[0] : undefined;
  logger.warn('Clerk auth missing userId', {
    hasAuth: Boolean(auth),
    sessionId: (auth as any)?.sessionId,
    userId: (auth as any)?.userId,
    tokenType: (auth as any)?.tokenType,
    hasAuthorizationHeader: Boolean(authorization),
    authorizationScheme: scheme,
    authorizationLength: authorization?.length,
  });
}

async function getOrCreateUserForClerkId(clerkId: string) {
  const existing = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true, email: true, referralCode: true },
  });
  if (existing) {
    if (!existing.referralCode) {
      const referralCode = await generateUniqueReferralCode();
      await prisma.user.update({ where: { id: existing.id }, data: { referralCode } });
      return { ...existing, referralCode };
    }

    return existing;
  }

  const clerkUser = await clerkClient.users.getUser(clerkId);

  const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
  if (!email) throw missingPrimaryEmail();

  const phone = clerkUser.phoneNumbers.find((p) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber;

  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;

  const referralCode = await generateUniqueReferralCode();

  const created = await prisma.user.create({
    data: {
      clerkId,
      email,
      ...(phone ? { phone } : {}),
      fullName,
      referralCode,
    },
    select: { id: true, clerkId: true, email: true, referralCode: true },
  });

  await ensureUserHasRole(created.id, ROLES.USER);
  if (isBootstrapSuperAdminEmail(email)) {
    await ensureUserHasRole(created.id, ROLES.SUPER_ADMIN);
  }

  return created;
}

async function getRoleNamesForUserId(userId: string) {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: { name: true } } },
  });
  return roles.map((r) => r.role.name);
}

const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth?.userId) {
      console.log('No user ID found in auth', auth);
      logMissingUserId(req, auth);
      return next(unauthorized());
    }

    const user = await getOrCreateUserForClerkId(auth.userId);

    if (user.email && isBootstrapSuperAdminEmail(user.email)) {
      await ensureUserHasRole(user.id, ROLES.SUPER_ADMIN);
    }

    const roleNames = await getRoleNamesForUserId(user.id);

    req.currentUser = user;
    req.currentUserRoles = roleNames;

    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;
