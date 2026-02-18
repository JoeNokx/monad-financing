
import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import {
  adminListKyc,
  adminListLoans,
  adminListNotifications,
  adminListTransactions,
  adminListUsers,
  adminSendNotification,
  adminSetKycStatus,
  adminSetLoanStatus,
  adminSetUserBlocked,
  assignUserRoles,
  readSettings,
  writeSettings,
} from './service';

function paramAsString(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? '';
  if (typeof value === 'string') return value;
  return '';
}

export const getSettings: RequestHandler = async (_req, res, next) => {
  try {
    const settings = await readSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const listUsers: RequestHandler = async (_req, res, next) => {
  try {
    const data = await adminListUsers();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateUserBlocked: RequestHandler = async (req, res, next) => {
  try {
    const userId = paramAsString((req.params as any).userId);
    if (!userId) throw new ApiError('Invalid userId', { statusCode: 400, code: 'INVALID_USER_ID' });

    const data = await adminSetUserBlocked(userId, req.body.isBlocked);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listLoans: RequestHandler = async (_req, res, next) => {
  try {
    const data = await adminListLoans();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateLoanStatus: RequestHandler = async (req, res, next) => {
  try {
    const loanId = paramAsString((req.params as any).loanId);
    if (!loanId) throw new ApiError('Invalid loanId', { statusCode: 400, code: 'INVALID_LOAN_ID' });

    const data = await adminSetLoanStatus(loanId, req.body.status);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listKyc: RequestHandler = async (_req, res, next) => {
  try {
    const data = await adminListKyc();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateKycStatus: RequestHandler = async (req, res, next) => {
  try {
    const userId = paramAsString((req.params as any).userId);
    if (!userId) throw new ApiError('Invalid userId', { statusCode: 400, code: 'INVALID_USER_ID' });

    const data = await adminSetKycStatus(userId, req.body.status);
    res.json({ success: true, data });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return next(new ApiError('KYC record not found', { statusCode: 404, code: 'KYC_NOT_FOUND' }));
    }
    next(err);
  }
};

export const listTransactions: RequestHandler = async (_req, res, next) => {
  try {
    const data = await adminListTransactions();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listAllNotifications: RequestHandler = async (req, res, next) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const data = await adminListNotifications(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createAdminNotification: RequestHandler = async (req, res, next) => {
  try {
    const data = await adminSendNotification(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const settings = await writeSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const setUserRoles: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });

    const userId = paramAsString((req.params as any).userId);
    if (!userId) throw new ApiError('Invalid userId', { statusCode: 400, code: 'INVALID_USER_ID' });

    const result = await assignUserRoles(userId, req.body);
    if (!result) throw new ApiError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });

    res.json({ success: true, data: { roles: result } });
  } catch (err) {
    next(err);
  }
};
