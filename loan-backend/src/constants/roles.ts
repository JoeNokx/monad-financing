export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPERADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
