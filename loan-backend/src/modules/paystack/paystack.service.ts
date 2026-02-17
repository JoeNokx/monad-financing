import { Prisma } from '@prisma/client';

import ApiError from '../../common/errors/ApiError';
import prisma from '../../config/database';
import { env, requireEnv } from '../../config/env';
import generateReference from '../../utils/generateReference';

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export async function initializeRepayment(args: {
  userId: string;
  email: string;
  loanId: string;
  amount: number;
}) {
  requireEnv('PAYSTACK_SECRET_KEY');

  const loan = await prisma.loan.findUnique({ where: { id: args.loanId } });
  if (!loan || loan.userId !== args.userId) {
    throw new ApiError('Loan not found', { statusCode: 404, code: 'LOAN_NOT_FOUND' });
  }
  if (loan.status !== 'ACTIVE') {
    throw new ApiError('Loan is not active', { statusCode: 400, code: 'LOAN_NOT_ACTIVE' });
  }

  const reference = generateReference('paystack');
  const amountKobo = Math.round(args.amount * 100);
  if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
    throw new ApiError('Invalid amount', { statusCode: 400, code: 'INVALID_AMOUNT' });
  }

  await prisma.transaction.create({
    data: {
      userId: args.userId,
      loanId: loan.id,
      paystackRef: reference,
      amount: new Prisma.Decimal(args.amount),
      status: 'PENDING',
    },
  });

  const response = await fetch(`${env.PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: args.email,
      amount: amountKobo,
      reference,
      metadata: {
        loanId: args.loanId,
      },
    }),
  });

  const json = (await response.json()) as PaystackInitializeResponse;
  if (!response.ok || !json.status || !json.data) {
    throw new ApiError(json.message || 'Paystack initialize failed', {
      statusCode: 502,
      code: 'PAYSTACK_INITIALIZE_FAILED',
      details: json,
    });
  }

  return json.data;
}
