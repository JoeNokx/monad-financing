import { z } from 'zod';

export const submitKycSchema = z.object({
  body: z.object({
    idType: z.string().min(1),
    idNumber: z.string().min(3),
    idImageUrl: z.string().url(),
    selfieUrl: z.string().url(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
