
import {
  broadcastNotification,
  createNotification,
  getSystemSettings,
  listAllLoans,
  listAllTransactions,
  listKycSubmissions,
  listNotifications,
  listUsers,
  setKycStatus,
  setLoanStatus,
  setRolesForUser,
  setUserBlocked,
  updateSystemSettings,
} from './repository';
import type { SetUserRolesInput, UpdateSystemSettingsInput } from './types';

export async function readSettings() {
  return getSystemSettings();
}

export async function writeSettings(input: UpdateSystemSettingsInput) {
  return updateSystemSettings(input);
}

export async function assignUserRoles(userId: string, input: SetUserRolesInput) {
  return setRolesForUser({ userId, roles: input.roles });
}

export async function adminListUsers() {
  return listUsers();
}

export async function adminSetUserBlocked(userId: string, isBlocked: boolean) {
  return setUserBlocked({ userId, isBlocked });
}

export async function adminListLoans() {
  return listAllLoans();
}

export async function adminSetLoanStatus(loanId: string, status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED') {
  return setLoanStatus({ loanId, status });
}

export async function adminListKyc() {
  return listKycSubmissions();
}

export async function adminSetKycStatus(userId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return setKycStatus({ userId, status });
}

export async function adminListTransactions() {
  return listAllTransactions();
}

export async function adminListNotifications(userId?: string) {
  return listNotifications({ userId });
}

export async function adminSendNotification(args: { userId?: string; type: string; message: string }) {
  if (!args.userId) return broadcastNotification({ type: args.type, message: args.message });
  return createNotification({ userId: args.userId, type: args.type, message: args.message });
}
