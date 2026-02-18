
import { z } from 'zod';

export const updateSystemSettingsSchema = z.object({
  body: z
    .object({
      defaultInterestRatePercent: z.number().nonnegative().optional(),
      defaultGracePeriodDays: z.number().int().nonnegative().optional(),
      defaultPenaltyPerDay: z.number().nonnegative().optional(),
      defaultMaxPenalty: z.number().nonnegative().optional(),

      personalDefaultRepaymentFrequency: z.string().nullable().optional(),
      personalDefaultTotalInstallments: z.number().int().positive().nullable().optional(),

      businessDefaultRepaymentFrequency: z.string().nullable().optional(),
      businessDefaultTotalInstallments: z.number().int().positive().nullable().optional(),
    })
    .strict(),
});

export const setUserRolesSchema = z.object({
  body: z
    .object({
      roles: z.array(z.string().min(1)).min(1),
    })
    .strict(),
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const setUserBlockedSchema = z.object({
  body: z
    .object({
      isBlocked: z.boolean(),
    })
    .strict(),
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const setLoanStatusSchema = z.object({
  body: z
    .object({
      status: z.enum(['ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED']),
    })
    .strict(),
  params: z.object({
    loanId: z.string().uuid(),
  }),
});

export const setKycStatusSchema = z.object({
  body: z
    .object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    })
    .strict(),
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const createNotificationSchema = z.object({
  body: z
    .object({
      userId: z.string().uuid().optional(),
      type: z.string().min(1),
      message: z.string().min(1),
    })
    .strict(),
});
