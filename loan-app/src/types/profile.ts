export type Profile = {
  id: string;
  clerkUserId: string;
  isComplete: boolean;

  fullName: string | null;
  phoneNumber: string | null;
  referralCode: string | null;
  dateOfBirth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelationship: string | null;
  mobileNetwork: 'MTN' | 'Telecel' | 'AirtelTigo' | null;
  mobileNumber: string | null;
  mobileName: string | null;

  createdAt: string;
  updatedAt: string;
};

export type ProfileMeResponse = {
  profile: Profile | null;
  isComplete: boolean;
};

export type ProfileUpsertPatch = {
  fullName?: string;
  phoneNumber?: string;
  referralCode?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;

  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;

  mobileNetwork?: 'MTN' | 'Telecel' | 'AirtelTigo';
  mobileNumber?: string;
  mobileName?: string;
};
