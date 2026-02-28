
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
  personalMaxLoanAmount?: number | null;
  personalDurationOptionsDays?: number[] | null;
  personalInterestRatePercent?: number | null;
  personalServiceChargePercent?: number | null;

  businessMinLoanAmount?: number | null;
  businessMaxLoanAmount?: number | null;
  businessDurationOptionsDays?: number[] | null;
  businessInterestRatePercent?: number | null;
  businessServiceChargePercent?: number | null;
};

export type SetUserRolesInput = {
  roles: string[];
};
