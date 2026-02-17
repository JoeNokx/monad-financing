import { Prisma } from '@prisma/client';

type Amount = Prisma.Decimal | number | string;

export default function calculatePenalty(
  penaltyPerDay: Amount,
  dayCount: number,
  maxPenalty: Amount | null | undefined,
  currentPenalty: Amount | null | undefined,
): Prisma.Decimal {
  const perDay = new Prisma.Decimal(penaltyPerDay);
  const current = new Prisma.Decimal(currentPenalty ?? 0);
  const total = perDay.mul(dayCount);

  if (maxPenalty === null || maxPenalty === undefined) return total;

  const max = new Prisma.Decimal(maxPenalty);
  const remaining = max.minus(current);
  if (remaining.lte(0)) return new Prisma.Decimal(0);
  return total.greaterThan(remaining) ? remaining : total;
}
