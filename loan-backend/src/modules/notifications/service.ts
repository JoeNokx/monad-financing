import { listNotifications, markAllRead } from './repository';

export async function listMyNotifications(userId: string) {
  return listNotifications(userId);
}

export async function markMyNotificationsRead(userId: string) {
  await markAllRead(userId);
  return { success: true };
}
