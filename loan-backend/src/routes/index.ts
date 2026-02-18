import { Router } from 'express';

import prisma from '../config/database';
import { env } from '../config/env';
import usersRoutes from '../modules/users/routes';
import authRoutes from '../modules/auth/routes';
import kycRoutes from '../modules/kyc/routes';
import loansRoutes from '../modules/loans/routes';
import ledgerRoutes from '../modules/ledger/routes';
import transactionsRoutes from '../modules/transactions/routes';
import notificationsRoutes from '../modules/notifications/routes';
import adminRoutes from '../modules/admin/routes';
import paystackRoutes from '../modules/paystack/paystack.routes';
import webhookRoutes from '../modules/webhooks/webhook.routes';
import personalLoanRoutes from '../modules/personal-loan/personal-loan.routes';
import businessLoanRoutes from '../modules/business-loan/business-loan.routes';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    if (env.NODE_ENV === 'test') {
      res.status(200).json({ success: true, status: 'ok', db: 'skipped' });
      return;
    }
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, status: 'ok', db: 'ok' });
  } catch {
    res.status(503).json({ success: false, status: 'degraded', db: 'unavailable' });
  }
});

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/loans', loansRoutes);
router.use('/personal-loan', personalLoanRoutes);
router.use('/business-loan', businessLoanRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);
router.use('/paystack', paystackRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
