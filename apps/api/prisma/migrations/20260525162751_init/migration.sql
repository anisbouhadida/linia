-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BLOCKED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('RUN_CREATED', 'TASK_STARTED', 'TASK_COMPLETED', 'TASK_FAILED', 'EVIDENCE_ADDED', 'TASK_UNLOCKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateTask" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "estimatedMinutes" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TemplateTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateDependency" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,

    CONSTRAINT "TemplateDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunTask" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "templateTaskId" TEXT,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "estimatedMinutes" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT false,
    "status" "TaskStatus" NOT NULL DEFAULT 'BLOCKED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RunTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunTaskDependency" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,

    CONSTRAINT "RunTaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "runTaskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "runTaskId" TEXT,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus",
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TemplateTask_templateId_orderIndex_idx" ON "TemplateTask"("templateId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateTask_templateId_externalId_key" ON "TemplateTask"("templateId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateDependency_taskId_dependsOnTaskId_key" ON "TemplateDependency"("taskId", "dependsOnTaskId");

-- CreateIndex
CREATE INDEX "RunTask_runId_status_idx" ON "RunTask"("runId", "status");

-- CreateIndex
CREATE INDEX "RunTask_runId_orderIndex_idx" ON "RunTask"("runId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "RunTask_runId_externalId_key" ON "RunTask"("runId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "RunTaskDependency_taskId_dependsOnTaskId_key" ON "RunTaskDependency"("taskId", "dependsOnTaskId");

-- CreateIndex
CREATE INDEX "Evidence_runTaskId_idx" ON "Evidence"("runTaskId");

-- CreateIndex
CREATE INDEX "AuditEntry_runId_createdAt_idx" ON "AuditEntry"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEntry_runTaskId_idx" ON "AuditEntry"("runTaskId");

-- AddForeignKey
ALTER TABLE "TemplateTask" ADD CONSTRAINT "TemplateTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateDependency" ADD CONSTRAINT "TemplateDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TemplateTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateDependency" ADD CONSTRAINT "TemplateDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "TemplateTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTask" ADD CONSTRAINT "RunTask_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTaskDependency" ADD CONSTRAINT "RunTaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RunTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunTaskDependency" ADD CONSTRAINT "RunTaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "RunTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_runTaskId_fkey" FOREIGN KEY ("runTaskId") REFERENCES "RunTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
