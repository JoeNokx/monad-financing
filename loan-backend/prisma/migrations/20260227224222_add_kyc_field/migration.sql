-- AlterTable
ALTER TABLE "kyc_verifications" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "businessDurationOptionsDays" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "businessInterestRatePercent" DECIMAL(65,30),
ADD COLUMN     "businessMaxLoanAmount" DECIMAL(65,30),
ADD COLUMN     "businessMinLoanAmount" DECIMAL(65,30),
ADD COLUMN     "businessServiceChargePercent" DECIMAL(65,30),
ADD COLUMN     "personalMaxLoanAmount" DECIMAL(65,30);
