import ApiError from '../../common/errors/ApiError';
import { listTransactionsByUser } from './repository';

export async function listMyTransactions(userId: string) {
  if (!userId) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  return listTransactionsByUser(userId);
}
