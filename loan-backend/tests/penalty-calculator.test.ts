import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import calculatePenalty from '../src/utils/calculatePenalty';
import { calculateDailyPenalty } from '../src/modules/penalty/penalty-calculator';

describe('penalty calculation', () => {
  it('calculates penalty without a max', () => {
    const result = calculatePenalty(10, 3, null, null);
    expect(result.toString()).toBe('30');
  });

  it('caps penalty at maxPenalty - currentPenalty', () => {
    const result = calculatePenalty(10, 1, 100, 95);
    expect(result.toString()).toBe('5');
  });

  it('returns 0 when currentPenalty is already at or above maxPenalty', () => {
    const result = calculatePenalty(10, 1, 100, 100);
    expect(result.toString()).toBe('0');
  });

  it('calculateDailyPenalty delegates to calculatePenalty dayCount=1', () => {
    const result = calculateDailyPenalty({
      penaltyPerDay: new Prisma.Decimal('12.5'),
      maxPenalty: new Prisma.Decimal('20'),
      currentPenalty: new Prisma.Decimal('10'),
    });
    expect(result.toString()).toBe('10');
  });
});
