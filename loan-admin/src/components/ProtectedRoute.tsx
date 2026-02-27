import { useAuth } from '@clerk/clerk-react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Card } from './common/Card';
import { Spinner } from './common/Spinner';
import api from '../lib/api';
import { ROLES } from '../constants/roles';
import type { ApiEnvelope } from '../types/api';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();

  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const res = await api.get<
        ApiEnvelope<{
          roles: string[];
        }>
      >('/auth/session');

      return res.data.data;
    },
  });

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (sessionQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          Loading session...
        </div>
      </div>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return <Navigate to="/login" replace />;
  }

  const roles = sessionQuery.data.roles ?? [];
  const isAdmin = roles.some((r) => r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN || r === ROLES.MANAGER || r === ROLES.STAFF);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-base font-semibold text-slate-900">Access denied</div>
          <div className="mt-2 text-sm text-slate-600">Your account does not have admin access.</div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
