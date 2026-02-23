import { z } from 'zod';

const genderSchema = z.enum(['male', 'female', 'other']);
const mobileNetworkSchema = z.enum(['MTN', 'Telecel', 'AirtelTigo']);

export const upsertProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2).optional(),
      phoneNumber: z.string().min(7).optional(),
      referralCode: z.string().min(1).optional(),
      dateOfBirth: z.coerce.date().optional(),
      gender: genderSchema.optional(),
      address: z.string().min(3).optional(),

      emergencyName: z.string().min(2).optional(),
      emergencyPhone: z.string().min(7).optional(),
      emergencyRelationship: z.string().min(2).optional(),

      mobileNetwork: mobileNetworkSchema.optional(),
      mobileNumber: z.string().min(7).optional(),
      mobileName: z.string().min(2).optional(),
    })
    .strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
