-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "overdueNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Debt_dueDate_idx" ON "Debt"("dueDate");
