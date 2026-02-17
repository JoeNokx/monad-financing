import { z } from 'zod';

export const applyLoanSchema = z.object({
  body: z.object({
    loanType: z.string().min(1),
    amount: z.number().positive(),
    durationDays: z.number().int().positive(),
    interestRatePercent: z.number().nonnegative(),
    gracePeriodDays: z.number().int().nonnegative().optional(),
    penaltyPerDay: z.number().nonnegative().optional(),
    maxPenalty: z.number().nonnegative().optional(),
    repaymentFrequency: z.string().optional(),
    totalInstallments: z.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const repayLoanSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
  }),
  params: z.object({
    loanId: z.string().uuid(),
  }),
  query: z.object({}).optional(),
});
