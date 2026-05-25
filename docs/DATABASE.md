# DATABASE.md — Linia MVP Database Design

Linia MVP uses PostgreSQL with Prisma ORM.

This document defines the first stable database draft for the MVP. It is intentionally narrow and optimized for a solo-developer delivery timeline.

---

## 1. Database Principles

The database must support the core Linia flow:

1. A user logs in.
2. The user creates or imports a template.
3. The template contains ordered tasks.
4. Tasks may depend on previous tasks.
5. A run is launched from a template.
6. Template tasks and dependencies are snapshotted into run tasks and run dependencies.
7. Operators execute tasks during the live run.
8. Text-only evidence may be attached to tasks.
9. Every meaningful state transition writes an append-only audit entry.

The database must stay simple.

Strict MVP exclusions:

- No multi-tenant architecture.
- No organizations.
- No workspace table.
- No complex RBAC.
- No file upload metadata.
- No WebSocket or realtime infrastructure tables.
- No notification tables.
- No integration tables.
- No workflow-builder tables.

---

## 2. Core Database Decisions

### 2.1 PostgreSQL

PostgreSQL is the source of truth.

Use it for:

- Relational integrity.
- Foreign keys.
- Unique constraints.
- Indexes.
- Transactional state transitions.
- Audit persistence.

### 2.2 Prisma

Prisma is used for:

- Schema definition.
- Type-safe client generation.
- Migrations.
- Database seeding.
- Transactions.

Use Prisma migrations for all schema changes.

Do not manually change production schema outside migrations.

### 2.3 Run Snapshot Rule

A `Template` is editable.

A `Run` must be stable.

When a run is launched, Linia must copy template tasks and template dependencies into run-specific tables:

- `RunTask`
- `RunTaskDependency`

Reason:

- A template can change later.
- A historical run must preserve what was actually executed.
- Audit history must remain consistent.

### 2.4 Evidence Is Text-Only

Evidence must be stored as plain text content.

Do not add file-upload fields such as:

- `fileName`
- `fileUrl`
- `mimeType`
- `fileHash`
- `storageKey`
- `sizeBytes`

The MVP does not support evidence file uploads.

### 2.5 Audit Is Append-Only

`AuditEntry` records must never be updated or deleted by application code.

Do not create:

- Audit update endpoint.
- Audit delete endpoint.
- Audit edit UI.
- Audit mutation service.

A SQL trigger to block update/delete can be added later after the schema is finalized, but the MVP must at least enforce append-only behavior at the application layer.

---

## 3. Entity Overview

| Entity | Purpose |
| --- | --- |
| `User` | Single seeded admin/operator account and audit actor attribution. |
| `Template` | Reusable checklist blueprint. |
| `TemplateTask` | Task inside a template. |
| `TemplateDependency` | Dependency between template tasks. |
| `Run` | Live execution instance launched from a template. |
| `RunTask` | Snapshot of a template task inside a run. |
| `RunTaskDependency` | Snapshot of task dependencies inside a run. |
| `Evidence` | Text-only proof attached to a run task. |
| `AuditEntry` | Immutable event log for run and task actions. |

---

## 4. Enums

```prisma
enum TaskStatus {
  BLOCKED
  READY
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum AuditAction {
  RUN_CREATED
  TASK_READY
  TASK_STARTED
  TASK_COMPLETED
  TASK_FAILED
  EVIDENCE_ADDED
}
```

---

## 5. Prisma Schema Draft

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TaskStatus {
  BLOCKED
  READY
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum AuditAction {
  RUN_CREATED
  TASK_READY
  TASK_STARTED
  TASK_COMPLETED
  TASK_FAILED
  EVIDENCE_ADDED
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  displayName  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  evidence     Evidence[]
  auditEntries AuditEntry[]

  @@index([email])
}

model Template {
  id          String   @id @default(uuid())
  name        String
  description String?
  version     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tasks        TemplateTask[]
  dependencies TemplateDependency[]
  runs         Run[]

  @@index([createdAt])
}

model TemplateTask {
  id               String   @id @default(uuid())
  templateId       String
  externalId       String
  title            String
  description      String?
  owner            String?
  estimatedMinutes Int?
  orderIndex       Int
  requiresEvidence Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  template     Template @relation(fields: [templateId], references: [id], onDelete: Cascade)

  dependencies TemplateDependency[] @relation("TemplateTaskDependencies")
  dependents    TemplateDependency[] @relation("TemplateTaskDependents")
  runTasks      RunTask[]

  @@unique([templateId, externalId])
  @@unique([templateId, orderIndex])
  @@index([templateId, orderIndex])
}

model TemplateDependency {
  id              String   @id @default(uuid())
  templateId      String
  taskId          String
  dependsOnTaskId String
  createdAt       DateTime @default(now())

  template      Template     @relation(fields: [templateId], references: [id], onDelete: Cascade)
  task          TemplateTask @relation("TemplateTaskDependencies", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnTask TemplateTask @relation("TemplateTaskDependents", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnTaskId])
  @@index([templateId])
  @@index([taskId])
  @@index([dependsOnTaskId])
}

model Run {
  id          String    @id @default(uuid())
  templateId  String
  name        String
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  template     Template     @relation(fields: [templateId], references: [id], onDelete: Restrict)
  tasks        RunTask[]
  dependencies RunTaskDependency[]
  auditEntries AuditEntry[]

  @@index([templateId, startedAt])
  @@index([startedAt])
}

model RunTask {
  id               String     @id @default(uuid())
  runId            String
  templateTaskId   String?
  externalId       String
  title            String
  description      String?
  owner            String?
  estimatedMinutes Int?
  orderIndex       Int
  requiresEvidence Boolean    @default(false)
  status           TaskStatus @default(BLOCKED)
  startedAt        DateTime?
  completedAt      DateTime?
  failedAt         DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  run          Run           @relation(fields: [runId], references: [id], onDelete: Cascade)
  templateTask TemplateTask? @relation(fields: [templateTaskId], references: [id], onDelete: SetNull)

  evidence     Evidence[]
  dependencies RunTaskDependency[] @relation("RunTaskDependencies")
  dependents    RunTaskDependency[] @relation("RunTaskDependents")
  auditEntries  AuditEntry[]

  @@unique([runId, externalId])
  @@unique([runId, orderIndex])
  @@index([runId, status])
  @@index([runId, orderIndex])
  @@index([templateTaskId])
}

model RunTaskDependency {
  id              String   @id @default(uuid())
  runId           String
  taskId          String
  dependsOnTaskId String
  createdAt       DateTime @default(now())

  run           Run     @relation(fields: [runId], references: [id], onDelete: Cascade)
  task          RunTask @relation("RunTaskDependencies", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnTask RunTask @relation("RunTaskDependents", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnTaskId])
  @@index([runId])
  @@index([taskId])
  @@index([dependsOnTaskId])
}

model Evidence {
  id          String   @id @default(uuid())
  runTaskId   String
  createdById String
  content     String
  createdAt   DateTime @default(now())

  runTask   RunTask @relation(fields: [runTaskId], references: [id], onDelete: Cascade)
  createdBy User    @relation(fields: [createdById], references: [id], onDelete: Restrict)

  @@index([runTaskId, createdAt])
  @@index([createdById])
}

model AuditEntry {
  id          String      @id @default(uuid())
  runId       String
  runTaskId   String?
  actorId     String?
  action      AuditAction
  fromStatus  TaskStatus?
  toStatus    TaskStatus?
  message     String?
  metadata    Json?
  createdAt   DateTime    @default(now())

  run     Run      @relation(fields: [runId], references: [id], onDelete: Restrict)
  runTask RunTask? @relation(fields: [runTaskId], references: [id], onDelete: SetNull)
  actor   User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([runId, createdAt])
  @@index([runTaskId, createdAt])
  @@index([actorId])
  @@index([action, createdAt])
}
```

---

## 6. Model Details

### 6.1 User

The MVP uses a single seeded admin/operator account.

`User` exists for:

- Authentication.
- Display name.
- Audit attribution.
- Evidence attribution.

Do not add advanced roles for MVP.

#### User Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `email` | `String` | Unique login email. |
| `passwordHash` | `String` | Hashed password only. Never store plaintext. |
| `displayName` | `String` | Human-readable actor name. |
| `createdAt` | `DateTime` | Creation timestamp. |
| `updatedAt` | `DateTime` | Update timestamp. |

---

### 6.2 Template

A reusable checklist blueprint.

Templates can be edited before launching runs.

#### Template Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `name` | `String` | Template name. |
| `description` | `String?` | Optional description. |
| `version` | `Int` | Simple version counter. |
| `createdAt` | `DateTime` | Creation timestamp. |
| `updatedAt` | `DateTime` | Update timestamp. |

---

### 6.3 TemplateTask

A single checklist line item inside a template.

#### TemplateTask Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `templateId` | `String` | Parent template. |
| `externalId` | `String` | Human-readable task code from CSV, such as `T-001`. |
| `title` | `String` | Short task name. |
| `description` | `String?` | Optional detailed instructions. |
| `owner` | `String?` | Text owner label, not a user relation. |
| `estimatedMinutes` | `Int?` | Optional estimate. |
| `orderIndex` | `Int` | Sort order. |
| `requiresEvidence` | `Boolean` | Whether text evidence is required before completion. |

#### TemplateTask Constraints

- `externalId` must be unique per template.
- `orderIndex` must be unique per template.

---

### 6.4 TemplateDependency

A dependency between two template tasks.

For MVP, only simple finish-to-start dependencies are supported.

Example:

- Task `T-002` depends on task `T-001`.
- `T-002` cannot start until `T-001` is completed in the run.

#### TemplateDependency Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `templateId` | `String` | Parent template. |
| `taskId` | `String` | The blocked/dependent task. |
| `dependsOnTaskId` | `String` | The predecessor task. |

#### TemplateDependency Constraints

- A task cannot depend on itself.
- Duplicate dependencies are not allowed.
- Both tasks must belong to the same template.
- Cycles should be rejected in service validation.

---

### 6.5 Run

A live execution instance created from a template.

A run must preserve the task and dependency graph from the moment it was launched.

#### Run Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `templateId` | `String` | Original template. |
| `name` | `String` | Run name. |
| `startedAt` | `DateTime` | Launch timestamp. |
| `completedAt` | `DateTime?` | Optional completion timestamp. |
| `createdAt` | `DateTime` | Creation timestamp. |
| `updatedAt` | `DateTime` | Update timestamp. |

---

### 6.6 RunTask

A snapshot of a template task inside a run.

Run tasks are the source of truth during execution.

#### RunTask Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `runId` | `String` | Parent run. |
| `templateTaskId` | `String?` | Original template task, nullable to preserve history. |
| `externalId` | `String` | Copied from template task. |
| `title` | `String` | Copied from template task. |
| `description` | `String?` | Copied from template task. |
| `owner` | `String?` | Copied owner label. |
| `estimatedMinutes` | `Int?` | Copied estimate. |
| `orderIndex` | `Int` | Copied order. |
| `requiresEvidence` | `Boolean` | Copied evidence requirement. |
| `status` | `TaskStatus` | Current execution status. |
| `startedAt` | `DateTime?` | Set when task starts. |
| `completedAt` | `DateTime?` | Set when task completes. |
| `failedAt` | `DateTime?` | Set when task fails. |

#### RunTask Constraints

- `externalId` must be unique per run.
- `orderIndex` must be unique per run.

---

### 6.7 RunTaskDependency

A snapshot of a dependency between two run tasks.

This prevents later template changes from affecting a live or historical run.

#### RunTaskDependency Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `runId` | `String` | Parent run. |
| `taskId` | `String` | The blocked/dependent run task. |
| `dependsOnTaskId` | `String` | The predecessor run task. |

#### RunTaskDependency Constraints

- A run task cannot depend on itself.
- Duplicate dependencies are not allowed.
- Both run tasks must belong to the same run.

---

### 6.8 Evidence

Text-only proof attached to a run task.

#### Evidence Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `runTaskId` | `String` | Task receiving evidence. |
| `createdById` | `String` | User who added evidence. |
| `content` | `String` | Text evidence. Must not be empty. |
| `createdAt` | `DateTime` | Creation timestamp. |

#### Validation Rules

Application service must enforce:

- `content.trim().length > 0`
- Evidence belongs to an existing run task.
- Evidence writes an audit entry.

---

### 6.9 AuditEntry

Immutable log of important actions.

Audit entries are append-only.

#### AuditEntry Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | UUID primary key. |
| `runId` | `String` | Parent run. |
| `runTaskId` | `String?` | Related task, if any. |
| `actorId` | `String?` | User who performed the action. |
| `action` | `AuditAction` | Event type. |
| `fromStatus` | `TaskStatus?` | Previous status, if relevant. |
| `toStatus` | `TaskStatus?` | New status, if relevant. |
| `message` | `String?` | Human-readable event summary. |
| `metadata` | `Json?` | Additional structured details. |
| `createdAt` | `DateTime` | Event timestamp. |

---

## 7. Status Rules

### 7.1 TaskStatus

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Task cannot start because at least one dependency is not completed. |
| `READY` | Task can be started. |
| `IN_PROGRESS` | Task has been started. |
| `COMPLETED` | Task has been completed. |
| `FAILED` | Task failed and should not unlock downstream tasks. |

### 7.2 Initial Status Calculation

When a run is launched:

- Tasks with no dependencies should become `READY`.
- Tasks with dependencies should remain `BLOCKED`.
- The recalculation should happen inside the same transaction as run creation.

### 7.3 Transition Rules

| Current Status | Allowed Next Status | Rule |
| --- | --- | --- |
| `READY` | `IN_PROGRESS` | Task can start only if all predecessors are `COMPLETED`. |
| `IN_PROGRESS` | `COMPLETED` | Task can complete only if evidence rules are satisfied. |
| `IN_PROGRESS` | `FAILED` | Task can fail. |
| `READY` | `FAILED` | Optional MVP rule: allow failing a ready task if operationally needed. |
| `BLOCKED` | `IN_PROGRESS` | Not allowed. |
| `COMPLETED` | Any status | Not allowed for MVP. |
| `FAILED` | Any status | Not allowed for MVP unless a later retry feature is explicitly added. |

---

## 8. Business Rules Enforced by Services

The database provides structure.

NestJS services enforce business behavior.

### 8.1 Dependency Rules

- A task is `READY` when all predecessor tasks are `COMPLETED`.
- A task is `BLOCKED` when at least one predecessor task is not `COMPLETED`.
- A `FAILED` predecessor does not unlock downstream tasks.
- A task cannot start while blocked.
- Dependency recalculation must happen after task completion or failure.

### 8.2 Evidence Rules

- A task with `requiresEvidence = true` cannot move to `COMPLETED` unless at least one text evidence row exists for that task.
- Evidence content must be non-empty text.
- Adding evidence must write an audit entry.

### 8.3 Audit Rules

- Creating a run writes `RUN_CREATED`.
- Starting a task writes `TASK_STARTED`.
- Adding evidence writes `EVIDENCE_ADDED`.
- Completing a task writes `TASK_COMPLETED`.
- Failing a task writes `TASK_FAILED`.
- Unlocking a downstream task may write `TASK_READY`.

---

## 9. CSV Import Mapping

CSV import should create a template, template tasks, and template dependencies.

For MVP, the backend receives CSV text, not a file upload.

### 9.1 Required CSV Columns

```csv
externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn
```

### 9.2 Example CSV

```csv
externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn
T-001,Check database connectivity,,DBA,15,true,
T-002,Run migration script,,SYS_ADMIN,45,true,T-001
T-003,Validate data integrity,,QA,30,false,T-002
```

### 9.3 Mapping

| CSV Column | Database Field |
| --- | --- |
| `externalId` | `TemplateTask.externalId` |
| `title` | `TemplateTask.title` |
| `description` | `TemplateTask.description` |
| `owner` | `TemplateTask.owner` |
| `estimatedMinutes` | `TemplateTask.estimatedMinutes` |
| `requiresEvidence` | `TemplateTask.requiresEvidence` |
| `dependsOn` | `TemplateDependency.dependsOnTaskId` resolved by `externalId` |

### 9.4 Import Validation

The import service must validate:

- Required columns exist.
- `externalId` is not empty.
- `title` is not empty.
- `externalId` is unique in the CSV.
- `dependsOn` references an existing `externalId`.
- `estimatedMinutes`, when provided, is a positive integer.
- `requiresEvidence` parses to a boolean.
- No self-dependencies.
- No obvious dependency cycles.

---

## 10. Recommended Indexes

Indexes are included in the Prisma schema draft.

Important access patterns:

| Access Pattern | Index |
| --- | --- |
| Find user by email | `User.email` unique index |
| List template tasks in order | `TemplateTask(templateId, orderIndex)` |
| Ensure task code uniqueness | `TemplateTask(templateId, externalId)` unique |
| List run tasks by status | `RunTask(runId, status)` |
| List run tasks in order | `RunTask(runId, orderIndex)` |
| Read run audit chronologically | `AuditEntry(runId, createdAt)` |
| Read task audit chronologically | `AuditEntry(runTaskId, createdAt)` |
| Read task evidence chronologically | `Evidence(runTaskId, createdAt)` |

---

## 11. Migration Plan

### 11.1 Local Development

Use:

```bash
pnpm --filter api prisma migrate dev
pnpm --filter api prisma generate
pnpm --filter api prisma db seed
```

### 11.2 Production

Use:

```bash
pnpm --filter api prisma migrate deploy
pnpm --filter api prisma generate
```

Do not run destructive reset commands in production.

Never use:

```bash
prisma migrate reset
```

against production data.

---

## 12. Seed Plan

The seed script should create:

1. One admin/operator user.
2. One demo template.
3. Three demo template tasks.
4. Two demo dependencies.

### 12.1 Admin Seed

Environment variables:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=change-me
```

The seed script must hash the password before storing it.

### 12.2 Demo Template

Example:

```text
Template: Demo Cutover
T-001 Check database connectivity
T-002 Run migration script
T-003 Validate data integrity
```

Dependencies:

```text
T-002 depends on T-001
T-003 depends on T-002
```

---

## 13. Transaction Requirements

Use transactions for:

- Launching a run.
- Starting a task.
- Adding evidence.
- Completing a task.
- Failing a task.
- Recalculating statuses.
- Writing audit entries.

### 13.1 Launch Run Transaction

The `POST /runs` transaction must:

1. Load template tasks and dependencies.
2. Create `Run`.
3. Copy `TemplateTask` rows into `RunTask`.
4. Copy `TemplateDependency` rows into `RunTaskDependency`.
5. Recalculate initial statuses.
6. Write `RUN_CREATED` audit entry.
7. Return run details.

### 13.2 Start Task Transaction

The start transaction must:

1. Load run task.
2. Validate status is `READY`.
3. Validate all predecessor tasks are `COMPLETED`.
4. Update status to `IN_PROGRESS`.
5. Set `startedAt`.
6. Write `TASK_STARTED` audit entry.

### 13.3 Add Evidence Transaction

The evidence transaction must:

1. Validate run task exists.
2. Validate text evidence is non-empty.
3. Create `Evidence`.
4. Write `EVIDENCE_ADDED` audit entry.

### 13.4 Complete Task Transaction

The complete transaction must:

1. Load run task.
2. Validate status is `IN_PROGRESS`.
3. If `requiresEvidence`, check evidence exists.
4. Update status to `COMPLETED`.
5. Set `completedAt`.
6. Recalculate downstream `READY` / `BLOCKED` statuses.
7. Write `TASK_COMPLETED` audit entry.
8. Optionally write `TASK_READY` entries for newly unlocked tasks.

### 13.5 Fail Task Transaction

The fail transaction must:

1. Load run task.
2. Validate task is not already `COMPLETED`.
3. Update status to `FAILED`.
4. Set `failedAt`.
5. Recalculate downstream statuses.
6. Write `TASK_FAILED` audit entry.

---

## 14. Backup Strategy

Production backups are required.

For Hostinger VPS MVP deployment, use daily `pg_dump`.

Example:

```bash
mkdir -p backups

docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "backups/linia_$(date +%F).sql"
```

Recommended:

- Run daily via cron.
- Keep at least 7 daily backups.
- Copy backups off the VPS when possible.
- Test restore at least once before real usage.

---

## 15. Restore Strategy

Example restore command:

```bash
cat backups/linia_YYYY-MM-DD.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

Before restoring production:

1. Stop the app containers.
2. Backup current database.
3. Restore into a clean database where possible.
4. Run smoke tests.
5. Restart app containers.

---

## 16. Security Rules

- Store only password hashes.
- Never commit `.env`.
- Use `DATABASE_URL` from environment variables.
- Keep production `.env` only on the VPS or deployment secret store.
- Restrict database ports from public internet.
- Do not expose Prisma Studio in production.
- Do not log passwords or session cookies.
- Do not add public signup for MVP.

---

## 17. Open Decisions Before Finalization

These should be confirmed before generating NestJS services or Angular components:

- Final names for task identifier fields: `externalId` vs `code`.
- Final run board endpoint shape.
- Whether `READY` task can move directly to `FAILED`.
- Whether SQL triggers should block `AuditEntry` update/delete in MVP.
- Whether `TASK_READY` audit entries should be written every time recalculation unlocks a task.
- Whether `completedAt` on `Run` should be set automatically when all run tasks are completed.

---

## 18. Final Database Rule

The database should support only the MVP:

- One admin/operator.
- One workspace.
- Templates.
- Tasks.
- Simple dependencies.
- Runs.
- Run task snapshots.
- Text evidence.
- Append-only audit entries.

Do not design the database for a future SaaS platform yet.
