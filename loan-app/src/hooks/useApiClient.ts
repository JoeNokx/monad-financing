import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { createApiClient } from '../services/api';

export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(() => {
    return createApiClient({
      getToken: async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      },
    });
  }, [getToken]);
}
