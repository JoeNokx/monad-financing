import { Prisma } from '@prisma/client';

type Amount = Prisma.Decimal | number | string;

export default function calculateInterest(principal: Amount, ratePercent: number): Prisma.Decimal {
  const p = new Prisma.Decimal(principal);
  const r = new Prisma.Decimal(ratePercent).div(100);
  return p.mul(r);
}
