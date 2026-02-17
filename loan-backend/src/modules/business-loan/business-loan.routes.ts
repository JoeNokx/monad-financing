import { Router } from 'express';
import { z } from 'zod';

import authenticate from '../../middleware/authenticate';
import validateRequest from '../../middleware/validateRequest';
import { apply } from './business-loan.controller';

const applyBusinessLoanSchema = z.object({
  body: z.object({
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

const router = Router();

router.post('/apply', authenticate, validateRequest(applyBusinessLoanSchema), apply);

export default router;
