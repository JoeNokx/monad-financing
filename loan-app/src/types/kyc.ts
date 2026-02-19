export type KycVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type KycVerification = {
  id: string;
  userId: string;
  idType: string;
  idNumber: string;
  idImageUrl: string;
  selfieUrl: string;
  verificationStatus: KycVerificationStatus;
  smileReference?: string | null;
  createdAt: string;
};

export type KycStatusResponse = {
  status: KycVerificationStatus | 'PENDING';
  hasSubmission: boolean;
  data?: KycVerification;
};
