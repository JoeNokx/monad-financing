import type { AuthObject } from '@clerk/express';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthObject;
    rawBody?: Buffer;
    currentUser?: {
      id: string;
      clerkId: string;
      email: string;
      referralCode?: string | null;
    };
    currentUserRoles?: string[];
  }
}

export {};
