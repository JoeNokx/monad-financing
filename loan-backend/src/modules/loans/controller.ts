import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { recordRepayment } from '../repayment/repayment.service';
import { applyLoan, getMyLoan, listMyLoans } from './service';

export const list: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const loans = await listMyLoans(req.currentUser.id);
    res.json({ success: true, data: loans });
  } catch (err) {
    next(err);
  }
};

export const getOne: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const loanId = Array.isArray(req.params.loanId) ? req.params.loanId[0] : req.params.loanId;
    const loan = await getMyLoan(req.currentUser.id, loanId);
    res.json({ success: true, data: loan });
  } catch (err) {
    next(err);
  }
};

export const apply: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const loan = await applyLoan(req.currentUser.id, req.body);
    res.status(201).json({ success: true, data: loan });
  } catch (err) {
    next(err);
  }
};

export const repay: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    const loanId = Array.isArray(req.params.loanId) ? req.params.loanId[0] : req.params.loanId;
    const result = await recordRepayment({
      userId: req.currentUser.id,
      loanId,
      amount: req.body.amount,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
