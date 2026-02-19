import { createApiClient } from './api';

import type { ApiEnvelope } from '../types/api';
import type { User } from '../types/user';

type UserServiceOptions = {
  getToken?: () => Promise<string | null>;
};

export function createUserService(options: UserServiceOptions = {}) {
  const api = createApiClient({ getToken: options.getToken });

  return {
    me: () => api.request<ApiEnvelope<User>>({ path: '/api/users/me' }),
  };
}
