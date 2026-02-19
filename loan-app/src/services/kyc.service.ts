import { createApiClient } from './api';

import type { ApiEnvelope } from '../types/api';
import type { KycStatusResponse } from '../types/kyc';

type KycServiceOptions = {
  getToken?: () => Promise<string | null>;
};

export function createKycService(options: KycServiceOptions = {}) {
  const api = createApiClient({ getToken: options.getToken });

  return {
    status: () => api.request<ApiEnvelope<KycStatusResponse>>({ path: '/api/kyc/status' }),
  };
}
