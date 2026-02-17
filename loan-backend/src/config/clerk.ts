import { env } from './env';

export const clerkConfig = {
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
  secretKey: env.CLERK_SECRET_KEY,
} as const;
