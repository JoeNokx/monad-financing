import logger from '../../common/logger/logger';
import { accrueDailyPenalties } from './penalty.service';

export async function runDailyPenaltyJob() {
  try {
    const result = await accrueDailyPenalties();
    logger.info('Daily penalty job completed', result);
    return result;
  } catch (err) {
    logger.error('Daily penalty job failed', { err });
    throw err;
  }
}
