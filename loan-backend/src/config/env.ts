import 'dotenv/config';

export type NodeEnv = 'development' | 'test' | 'production';

export const env = {
  NODE_ENV: (process.env.NODE_ENV as NodeEnv | undefined) ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_AUTHORIZED_PARTIES: process.env.CLERK_AUTHORIZED_PARTIES,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_BASE_URL: process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co',
} as const;

export function requireEnv(name: keyof typeof env): string {
  const value = env[name];
  if (!value || (typeof value === 'number' && Number.isNaN(value))) {
    throw new Error(`Missing required env var: ${String(name)}`);
  }
  return String(value);
}
