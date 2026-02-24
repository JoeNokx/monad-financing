-- CreateEnum
CREATE TYPE "KYCVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('LOAN_DISBURSEMENT', 'REPAYMENT', 'PENALTY', 'INTEREST', 'FEE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "fullName" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "creditScore" INTEGER NOT NULL DEFAULT 0,
    "maxPersonalLoans" INTEGER NOT NULL DEFAULT 2,
    "currentPersonalLoans" INTEGER NOT NULL DEFAULT 0,
    "maxBusinessLoans" INTEGER NOT NULL DEFAULT 1,
    "currentBusinessLoans" INTEGER NOT NULL DEFAULT 0,
    "loanLimit" DECIMAL(65,30) NOT NULL DEFAULT 1000,
    "originalLoanLimit" DECIMAL(65,30) NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idImageUrl" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "verificationStatus" "KYCVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "smileReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loanType" TEXT NOT NULL,
    "interestRatePercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "serviceChargePercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "serviceChargeAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "gracePeriodDays" INTEGER DEFAULT 3,
    "gracePeriodEnd" TIMESTAMP(3),
    "penaltyPerDay" DECIMAL(65,30),
    "maxPenalty" DECIMAL(65,30),
    "currentPenalty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "repaymentFrequency" TEXT,
    "totalInstallments" INTEGER,
    "paidInstallments" INTEGER NOT NULL DEFAULT 0,
    "originalAmount" DECIMAL(65,30) NOT NULL,
    "interestAmount" DECIMAL(65,30) NOT NULL,
    "totalRepayment" DECIMAL(65,30) NOT NULL,
    "amountPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL(65,30) NOT NULL,
    "status" "LoanStatus" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_growth_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousLimit" DECIMAL(65,30) NOT NULL,
    "newLimit" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "loanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_growth_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalty_history" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalty_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_installments" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "loan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loanId" TEXT,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "loanId" TEXT,
    "userId" TEXT NOT NULL,
    "paystackRef" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashedPin" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failed_pin_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failed_pin_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultInterestRatePercent" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "defaultGracePeriodDays" INTEGER NOT NULL DEFAULT 3,
    "defaultPenaltyPerDay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "defaultMaxPenalty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "personalDefaultRepaymentFrequency" TEXT DEFAULT 'MONTHLY',
    "personalDefaultTotalInstallments" INTEGER,
    "businessDefaultRepaymentFrequency" TEXT DEFAULT 'WEEKLY',
    "businessDefaultTotalInstallments" INTEGER,
    "personalMinLoanAmount" DECIMAL(65,30),
    "personalDurationOptionsDays" JSONB,
    "personalInterestRatePercent" DECIMAL(65,30),
    "personalServiceChargePercent" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT,
    "phoneNumber" TEXT,
    "referralCode" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "emergencyRelationship" TEXT,
    "mobileNetwork" TEXT,
    "mobileNumber" TEXT,
    "mobileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_clerkId_idx" ON "users"("clerkId");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_verifications_userId_key" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_verificationStatus_idx" ON "kyc_verifications"("verificationStatus");

-- CreateIndex
CREATE INDEX "kyc_verifications_createdAt_idx" ON "kyc_verifications"("createdAt");

-- CreateIndex
CREATE INDEX "loans_userId_idx" ON "loans"("userId");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loans_dueDate_idx" ON "loans"("dueDate");

-- CreateIndex
CREATE INDEX "loans_loanType_idx" ON "loans"("loanType");

-- CreateIndex
CREATE INDEX "loans_createdAt_idx" ON "loans"("createdAt");

-- CreateIndex
CREATE INDEX "loan_growth_history_userId_idx" ON "loan_growth_history"("userId");

-- CreateIndex
CREATE INDEX "loan_growth_history_loanId_idx" ON "loan_growth_history"("loanId");

-- CreateIndex
CREATE INDEX "loan_growth_history_createdAt_idx" ON "loan_growth_history"("createdAt");

-- CreateIndex
CREATE INDEX "penalty_history_loanId_idx" ON "penalty_history"("loanId");

-- CreateIndex
CREATE INDEX "penalty_history_createdAt_idx" ON "penalty_history"("createdAt");

-- CreateIndex
CREATE INDEX "loan_installments_loanId_idx" ON "loan_installments"("loanId");

-- CreateIndex
CREATE INDEX "loan_installments_dueDate_idx" ON "loan_installments"("dueDate");

-- CreateIndex
CREATE INDEX "loan_installments_isPaid_idx" ON "loan_installments"("isPaid");

-- CreateIndex
CREATE INDEX "ledger_entries_userId_idx" ON "ledger_entries"("userId");

-- CreateIndex
CREATE INDEX "ledger_entries_loanId_idx" ON "ledger_entries"("loanId");

-- CreateIndex
CREATE INDEX "ledger_entries_type_idx" ON "ledger_entries"("type");

-- CreateIndex
CREATE INDEX "ledger_entries_direction_idx" ON "ledger_entries"("direction");

-- CreateIndex
CREATE INDEX "ledger_entries_reference_idx" ON "ledger_entries"("reference");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_loanId_idx" ON "transactions"("loanId");

-- CreateIndex
CREATE INDEX "transactions_paystackRef_idx" ON "transactions"("paystackRef");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_pins_userId_key" ON "user_pins"("userId");

-- CreateIndex
CREATE INDEX "user_pins_userId_idx" ON "user_pins"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "failed_pin_attempts_userId_idx" ON "failed_pin_attempts"("userId");

-- CreateIndex
CREATE INDEX "failed_pin_attempts_ipAddress_idx" ON "failed_pin_attempts"("ipAddress");

-- CreateIndex
CREATE INDEX "failed_pin_attempts_createdAt_idx" ON "failed_pin_attempts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_clerkUserId_key" ON "profiles"("clerkUserId");

-- CreateIndex
CREATE INDEX "profiles_clerkUserId_idx" ON "profiles"("clerkUserId");

-- CreateIndex
CREATE INDEX "profiles_isComplete_idx" ON "profiles"("isComplete");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_growth_history" ADD CONSTRAINT "loan_growth_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_growth_history" ADD CONSTRAINT "loan_growth_history_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_history" ADD CONSTRAINT "penalty_history_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pins" ADD CONSTRAINT "user_pins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
