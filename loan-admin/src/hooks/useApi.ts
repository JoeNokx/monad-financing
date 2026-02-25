import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

import api from '../lib/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  data?: unknown;
  params?: Record<string, unknown>;
};

export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T,>({ method = 'GET', path, data, params }: RequestOptions) => {
      const token = await getToken();
      const res = await api.request<T>({
        method,
        url: path,
        data,
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.data;
    },
    [getToken],
  );

  return { request };
}
