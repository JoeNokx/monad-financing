import { z } from 'zod';

export const setPinSchema = z.object({
  body: z.object({
    pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const verifyPinSchema = z.object({
  body: z.object({
    pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
