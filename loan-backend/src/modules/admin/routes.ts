
import { Router } from 'express';

import { ROLES } from '../../constants/roles';
import authenticate from '../../middleware/authenticate';
import authorize from '../../middleware/authorize';
import validateRequest from '../../middleware/validateRequest';
import {
  createAdminNotification,
  getSettings,
  listAllNotifications,
  listKyc,
  listLoans,
  listTransactions,
  listUsers,
  setUserRoles,
  updateKycStatus,
  updateLoanStatus,
  updateSettings,
  updateUserBlocked,
} from './controller';
import {
  createNotificationSchema,
  setKycStatusSchema,
  setLoanStatusSchema,
  setUserBlockedSchema,
  setUserRolesSchema,
  updateSystemSettingsSchema,
} from './validator';

const router = Router();

const adminRoles = [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.ADMIN];

router.get('/settings', authenticate, authorize(adminRoles), getSettings);
router.patch('/settings', authenticate, authorize(adminRoles), validateRequest(updateSystemSettingsSchema), updateSettings);

router.get('/users', authenticate, authorize(adminRoles), listUsers);
router.patch('/users/:userId/block', authenticate, authorize(adminRoles), validateRequest(setUserBlockedSchema), updateUserBlocked);
router.put('/users/:userId/roles', authenticate, authorize(adminRoles), validateRequest(setUserRolesSchema), setUserRoles);

router.get('/loans', authenticate, authorize(adminRoles), listLoans);
router.patch('/loans/:loanId/status', authenticate, authorize(adminRoles), validateRequest(setLoanStatusSchema), updateLoanStatus);

router.get('/kyc', authenticate, authorize(adminRoles), listKyc);
router.patch('/kyc/:userId/status', authenticate, authorize(adminRoles), validateRequest(setKycStatusSchema), updateKycStatus);

router.get('/transactions', authenticate, authorize(adminRoles), listTransactions);

router.get('/notifications', authenticate, authorize(adminRoles), listAllNotifications);
router.post('/notifications', authenticate, authorize(adminRoles), validateRequest(createNotificationSchema), createAdminNotification);

export default router;
