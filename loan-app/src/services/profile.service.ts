import { createApiClient } from './api';

import type { ApiEnvelope } from '../types/api';
import type { ProfileMeResponse, ProfileUpsertPatch } from '../types/profile';

type ProfileServiceOptions = {
  getToken?: () => Promise<string | null>;
};

export function createProfileService(options: ProfileServiceOptions = {}) {
  const api = createApiClient({ getToken: options.getToken });

  return {
    me: () => api.request<ApiEnvelope<ProfileMeResponse>>({ path: '/api/profile/me' }),
    upsertMe: (patch: ProfileUpsertPatch) =>
      api.request<ApiEnvelope<ProfileMeResponse>>({ method: 'PUT', path: '/api/profile/me', body: patch }),
  };
}
