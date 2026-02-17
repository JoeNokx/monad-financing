import crypto from 'crypto';
import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import logger from '../../common/logger/logger';
import prisma from '../../config/database';
import { requireEnv } from '../../config/env';
import { recordRepayment } from '../repayment/repayment.service';

type PaystackEvent = {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
  };
};

function verifyPaystackSignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
  if (!rawBody || !signature) return false;
  const secret = requireEnv('PAYSTACK_SECRET_KEY');
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signature;
}

export const handlePaystackWebhook: RequestHandler = async (req, res, next) => {
  try {
    const signature = req.header('x-paystack-signature') ?? undefined;
    const ok = verifyPaystackSignature(req.rawBody, signature);
    if (!ok) {
      throw new ApiError('Invalid webhook signature', { statusCode: 401, code: 'INVALID_SIGNATURE' });
    }

    const body = req.body as PaystackEvent;

    if (!body?.data?.reference) {
      res.status(200).json({ success: true });
      return;
    }

    const tx = await prisma.transaction.findFirst({ where: { paystackRef: body.data.reference } });
    if (!tx) {
      logger.info('Paystack webhook reference not found', { reference: body.data.reference });
      res.status(200).json({ success: true });
      return;
    }

    if (body.event === 'charge.success' && body.data.status === 'success') {
      if (!tx.loanId) {
        logger.info('Paystack webhook tx missing loanId', { reference: body.data.reference, txId: tx.id });
        res.status(200).json({ success: true });
        return;
      }
      await recordRepayment({
        userId: tx.userId,
        loanId: tx.loanId,
        amount: tx.amount,
        paystackRef: tx.paystackRef ?? undefined,
      });
    } else if (body.event === 'charge.failed') {
      await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'FAILED' } });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};
