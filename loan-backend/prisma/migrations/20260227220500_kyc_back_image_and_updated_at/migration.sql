-- AlterTable
ALTER TABLE "kyc_verifications" ADD COLUMN     "idBackImageUrl" TEXT;

-- AlterTable
ALTER TABLE "kyc_verifications" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
