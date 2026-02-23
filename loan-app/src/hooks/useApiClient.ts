import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { env } from '../config/env';
import { createApiClient } from '../services/api';

export function useApiClient() {
  if (!env.clerkPublishableKey) {
    return useMemo(() => {
      return createApiClient({
        getToken: async () => null,
        timeoutMs: 15000,
      });
    }, []);
  }

  return useClerkApiClient();
}

function useClerkApiClient() {
  const { getToken } = useAuth();

  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  return useMemo(() => {
    return createApiClient({
      getToken: async () => {
        try {
          const sessionToken = await getTokenRef.current();
          if (sessionToken) return sessionToken;

          try {
            const templated = await getTokenRef.current({ template: 'standard' } as any);
            if (templated) return templated;
          } catch {
            // ignore
          }

          return null;
        } catch {
          return null;
        }
      },
      timeoutMs: 15000,
    });
  }, []);
}
