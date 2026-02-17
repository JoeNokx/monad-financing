import { Router } from 'express';
import { z } from 'zod';

import ApiError from '../../common/errors/ApiError';
import authenticate from '../../middleware/authenticate';
import validateRequest from '../../middleware/validateRequest';
import { initializeRepayment } from './paystack.service';

const initSchema = z.object({
  body: z.object({
    loanId: z.string().uuid(),
    amount: z.number().positive(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const router = Router();

router.post('/initialize', authenticate, validateRequest(initSchema), async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const data = await initializeRepayment({
      userId: req.currentUser.id,
      email: req.currentUser.email,
      loanId: req.body.loanId,
      amount: req.body.amount,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
