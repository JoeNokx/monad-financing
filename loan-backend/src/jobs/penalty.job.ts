
import logger from '../common/logger/logger';
import { runDailyPenaltyJob } from '../modules/penalty/daily-penalty.job';

export async function runPenaltyJob() {
  try {
    return await runDailyPenaltyJob();
  } catch (err) {
    logger.error('Penalty job failed', { err });
    throw err;
  }
}
