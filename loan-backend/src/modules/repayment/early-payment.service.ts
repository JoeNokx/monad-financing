import { recordRepayment } from './repayment.service';

export async function recordEarlyPayment(args: {
  userId: string;
  loanId: string;
  amount: number;
}) {
  return recordRepayment({
    userId: args.userId,
    loanId: args.loanId,
    amount: args.amount,
  });
}
