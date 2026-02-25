import { useMemo } from 'react';

import type { Role } from '../constants/roles';

export function usePermissions(role?: Role | null) {
  return useMemo(() => {
    const canApproveLoans = role === 'ADMIN' || role === 'STAFF';
    const canManageTeam = role === 'ADMIN';

    return {
      canApproveLoans,
      canManageTeam,
    };
  }, [role]);
}
