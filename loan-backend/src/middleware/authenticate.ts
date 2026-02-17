import type { RequestHandler } from 'express';
import { clerkClient, getAuth } from '@clerk/express';

import prisma from '../config/database';
import ApiError from '../common/errors/ApiError';
import { ROLES } from '../constants/roles';

const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const auth = getAuth(req);
    req.auth = auth;

    if (!auth?.userId) {
      return next(
        new ApiError('Unauthorized', {
          statusCode: 401,
          code: 'UNAUTHORIZED',
        }),
      );
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
      select: { id: true, clerkId: true, email: true },
    });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress;
      const phone = clerkUser.phoneNumbers.find((p) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber;

      if (!email) {
        return next(
          new ApiError('Clerk user is missing a primary email', {
            statusCode: 400,
            code: 'MISSING_EMAIL',
          }),
        );
      }

      if (!phone) {
        return next(
          new ApiError('Clerk user is missing a primary phone number', {
            statusCode: 400,
            code: 'MISSING_PHONE',
          }),
        );
      }

      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;

      const created = await prisma.user.create({
        data: {
          clerkId: auth.userId,
          email,
          phone,
          fullName,
        },
        select: { id: true, clerkId: true, email: true },
      });

      const role = await prisma.role.upsert({
        where: { name: ROLES.USER },
        update: {},
        create: { name: ROLES.USER },
        select: { id: true },
      });

      await prisma.userRole.create({
        data: {
          userId: created.id,
          roleId: role.id,
        },
      });

      user = created;
    }

    const roles = await prisma.userRole.findMany({
      where: { userId: user.id },
      select: { role: { select: { name: true } } },
    });

    req.currentUser = user;
    req.currentUserRoles = roles.map((r) => r.role.name);

    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;
