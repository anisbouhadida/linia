/*
  Warnings:

  - A unique constraint covering the columns `[runId,orderIndex]` on the table `RunTask` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[templateId,orderIndex]` on the table `TemplateTask` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `action` on the `AuditEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABORTED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('RUN_LAUNCHED', 'TASK_READY', 'TASK_STARTED', 'TASK_COMPLETED', 'TASK_FAILED', 'EVIDENCE_ADDED', 'RUN_COMPLETED', 'RUN_ABORTED');

-- DropIndex
DROP INDEX "AuditEntry_runTaskId_idx";

-- DropIndex
DROP INDEX "Evidence_runTaskId_idx";

-- AlterTable
ALTER TABLE "AuditEntry" DROP COLUMN "action",
ADD COLUMN     "action" "AuditEventType" NOT NULL;

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "status" "RunStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "RunTask" ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "AuditAction";

-- CreateIndex
CREATE INDEX "AuditEntry_runTaskId_createdAt_idx" ON "AuditEntry"("runTaskId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEntry_actorId_idx" ON "AuditEntry"("actorId");

-- CreateIndex
CREATE INDEX "AuditEntry_action_createdAt_idx" ON "AuditEntry"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_runTaskId_createdAt_idx" ON "Evidence"("runTaskId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_createdById_idx" ON "Evidence"("createdById");

-- CreateIndex
CREATE INDEX "RunTask_templateTaskId_idx" ON "RunTask"("templateTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "RunTask_runId_orderIndex_key" ON "RunTask"("runId", "orderIndex");

-- CreateIndex
CREATE INDEX "RunTaskDependency_runId_idx" ON "RunTaskDependency"("runId");

-- CreateIndex
CREATE INDEX "RunTaskDependency_taskId_idx" ON "RunTaskDependency"("taskId");

-- CreateIndex
CREATE INDEX "RunTaskDependency_dependsOnTaskId_idx" ON "RunTaskDependency"("dependsOnTaskId");

-- CreateIndex
CREATE INDEX "TemplateDependency_templateId_idx" ON "TemplateDependency"("templateId");

-- CreateIndex
CREATE INDEX "TemplateDependency_taskId_idx" ON "TemplateDependency"("taskId");

-- CreateIndex
CREATE INDEX "TemplateDependency_dependsOnTaskId_idx" ON "TemplateDependency"("dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateTask_templateId_orderIndex_key" ON "TemplateTask"("templateId", "orderIndex");

-- AddForeignKey
ALTER TABLE "TemplateDependency" ADD CONSTRAINT "TemplateDependency_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTask" ADD CONSTRAINT "RunTask_templateTaskId_fkey" FOREIGN KEY ("templateTaskId") REFERENCES "TemplateTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTaskDependency" ADD CONSTRAINT "RunTaskDependency_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_runTaskId_fkey" FOREIGN KEY ("runTaskId") REFERENCES "RunTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
