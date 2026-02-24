
export type UpdateSystemSettingsInput = {
  defaultInterestRatePercent?: number;
  defaultGracePeriodDays?: number;
  defaultPenaltyPerDay?: number;
  defaultMaxPenalty?: number;

  personalDefaultRepaymentFrequency?: string | null;
  personalDefaultTotalInstallments?: number | null;

  businessDefaultRepaymentFrequency?: string | null;
  businessDefaultTotalInstallments?: number | null;

  personalMinLoanAmount?: number | null;
  personalDurationOptionsDays?: number[] | null;
  personalInterestRatePercent?: number | null;
  personalServiceChargePercent?: number | null;
};

export type SetUserRolesInput = {
  roles: string[];
};
