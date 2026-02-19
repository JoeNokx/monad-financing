export const env = {
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
} as const;

export function requireEnv(key: keyof typeof env) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${String(key)}`);
  }
  return value;
}
