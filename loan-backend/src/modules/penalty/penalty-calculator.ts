import { Prisma } from '@prisma/client';

import calculatePenalty from '../../utils/calculatePenalty';

export function calculateDailyPenalty(args: {
  penaltyPerDay: Prisma.Decimal;
  maxPenalty?: Prisma.Decimal | null;
  currentPenalty?: Prisma.Decimal | null;
}) {
  return calculatePenalty(args.penaltyPerDay, 1, args.maxPenalty, args.currentPenalty);
}
