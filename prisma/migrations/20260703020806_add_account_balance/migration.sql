-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "balance" DECIMAL(65,30),
ADD COLUMN     "balanceUpdatedAt" TIMESTAMP(3);
