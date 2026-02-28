import { createApiClient } from './api';

import type { ApiEnvelope } from '../types/api';
import type { KycStatusResponse, KycVerification } from '../types/kyc';

type KycServiceOptions = {
  getToken?: () => Promise<string | null>;
};

export function createKycService(options: KycServiceOptions = {}) {
  const api = createApiClient({ getToken: options.getToken });

  return {
    status: () => api.request<ApiEnvelope<KycStatusResponse>>({ path: '/api/kyc/status' }),
    submitFiles: (args: {
      idType: string;
      idNumber: string;
      idFront: { uri: string; mimeType?: string | null; name?: string | null };
      idBack: { uri: string; mimeType?: string | null; name?: string | null };
      selfie: { uri: string; mimeType?: string | null; name?: string | null };
    }) => {
      const body = new FormData();
      body.append('idType', args.idType);
      body.append('idNumber', args.idNumber);

      const frontName = args.idFront.name ?? 'id_front.jpg';
      const backName = args.idBack.name ?? 'id_back.jpg';
      const selfieName = args.selfie.name ?? 'selfie.jpg';

      body.append('idFront', { uri: args.idFront.uri, name: frontName, type: args.idFront.mimeType ?? 'image/jpeg' } as any);
      body.append('idBack', { uri: args.idBack.uri, name: backName, type: args.idBack.mimeType ?? 'image/jpeg' } as any);
      body.append('selfie', { uri: args.selfie.uri, name: selfieName, type: args.selfie.mimeType ?? 'image/jpeg' } as any);

      return api.request<ApiEnvelope<KycVerification>>({ method: 'POST', path: '/api/kyc/submit-files', body });
    },
  };
}
