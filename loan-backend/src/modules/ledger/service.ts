import ApiError from '../../common/errors/ApiError';
import { listLedgerEntriesByUser } from './repository';

export async function listMyLedger(userId: string) {
  if (!userId) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  return listLedgerEntriesByUser(userId);
}
