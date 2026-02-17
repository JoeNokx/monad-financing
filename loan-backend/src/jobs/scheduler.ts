import logger from '../common/logger/logger';
import { runPenaltyJob } from './penalty.job';
import { runDailyRemindersJob } from './reminder.job';

type Timer = ReturnType<typeof setTimeout>;

const timers: Timer[] = [];

function msUntilNextTime(hour: number, minute: number) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function scheduleDailyAt(hour: number, minute: number, fn: () => Promise<void>, name: string) {
  const timeoutMs = msUntilNextTime(hour, minute);

  const timeout = setTimeout(() => {
    const run = async () => {
      try {
        await fn();
      } catch (err) {
        logger.error('Scheduled job failed', { name, err });
      }
    };

    void run();

    const interval = setInterval(() => {
      void run();
    }, 24 * 60 * 60 * 1000);

    timers.push(interval);
  }, timeoutMs);

  timers.push(timeout);
}

export function startScheduler() {
  scheduleDailyAt(0, 10, async () => {
    logger.info('Scheduled job started', { name: 'daily_penalties' });
    await runPenaltyJob();
  }, 'daily_penalties');

  scheduleDailyAt(0, 20, async () => {
    logger.info('Scheduled job started', { name: 'daily_reminders' });
    await runDailyRemindersJob();
  }, 'daily_reminders');

  logger.info('Scheduler started');
}

export function stopScheduler() {
  for (const t of timers) {
    clearTimeout(t);
  }
  timers.length = 0;
  logger.info('Scheduler stopped');
}
