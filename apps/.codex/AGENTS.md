# AGENTS.md — Linia AI Operating Rules

You are assisting with the development of Linia, a strict 3-month solo-developer MVP.

Your primary job is not to maximize features. Your primary job is to protect scope, preserve architectural simplicity, and help ship a working MVP fast.

## 1. Project Context

Linia is a single-workspace operational checklist execution tool for high-risk IT cutovers, migrations, maintenance windows, and infrastructure changes.

The product replaces manual Excel-style cutover sheets with a focused web application that provides:

- Template planning for repeatable operational checklists.
- Task sequencing with simple linear dependencies.
- Live run execution with strict task status control.
- Text-only proof-of-work evidence.
- Server-enforced dependency blocking.
- An append-only audit ledger for every state transition.

The MVP is built for one team first, not as a general SaaS platform.

The core domain objects are:

- `Template`: reusable checklist blueprint.
- `TemplateTask`: task definition inside a template.
- `TemplateDependency`: simple dependency between template tasks.
- `Run`: live execution instance created from a template.
- `RunTask`: snapshot of a task inside a run.
- `RunTaskDependency`: snapshot of dependencies inside a run.
- `Evidence`: text-only proof attached to a run task.
- `AuditEntry`: immutable log row written for every important action.

The core business rules are:

- A task cannot start unless all predecessor tasks are completed.
- A task requiring evidence cannot be completed unless text evidence exists.
- Failed tasks do not unlock downstream tasks.
- Every state transition must write an audit entry.
- Audit entries are append-only and must never be edited or deleted by application code.
- Angular may guide the user visually, but NestJS must enforce all business rules server-side.

## 2. Stack

Use this stack unless the user explicitly changes it:

- Monorepo: `pnpm` workspaces
- Frontend: Angular standalone components with Bootstrap v5.3 and Bootstrap Icons
- Backend: NestJS REST API
- Database: PostgreSQL
- ORM / migrations: Prisma
- E2E tests: Playwright
- Deployment: Docker Compose on Hostinger VPS
- Shared types: TypeScript package in `packages/shared`

Expected repository structure:

```text
linia/
├─ .codex/
│  └─ AGENTS.md
├─ apps/
│  ├─ api/
│  └─ web/
├─ packages/
│  └─ shared/
├─ docs/
│  ├─ PRD.md
│  ├─ API_CONTRACT.md
│  ├─ DATABASE.md
|  ├─ DESIGN.md
│  ├─ DECISIONS.md
│  └─ TODO.md
├─ infra/
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

### Node and package manager policy

Linia uses Volta locally to pin Node and pnpm.

Required local setup:

```bash
volta install node@24
volta install pnpm
volta pin node@24
volta pin pnpm
pnpm install
```

Rules:

- Use pnpm, not npm or yarn.
- Do not commit package-lock.json or yarn.lock.
- Commit pnpm-lock.yaml.
- Keep the Node version pinned in package.json under the volta field.
- CI and Docker must use the same Node major version.

## 3. Strict Architectural Constraints

These constraints are mandatory for the MVP.

### 3.1 NO WebSockets

Do not introduce WebSockets, Socket.IO, Server-Sent Events, Redis pub/sub, queues, or push-based realtime infrastructure.

Use simple HTTP polling instead.

For the live execution board, Angular must poll the backend every 5 seconds.

Preferred pattern:

- `GET /runs/:runId/board`
- Poll every `5000ms`
- Stop polling when the component is destroyed.
- Pause or reduce polling when the browser tab is hidden if easy to implement.
- Refresh immediately after user-triggered state transitions.

### 3.2 NO file uploads

Do not implement file uploads for the MVP.

This means:

- No uploaded evidence files.
- No S3.
- No object storage.
- No multer-based evidence upload.
- No file-hash verification.
- No uploaded attachments.
- No document storage subsystem.

Evidence is text-only.

CSV import must avoid general file-upload infrastructure. Prefer one of these MVP-safe approaches:

1. A textarea where the user pastes CSV content.
2. A small browser-side CSV file picker that reads the file locally and sends plain text CSV content to the API as JSON.
3. A direct API body such as `{ "csv": "externalId,title,...\nT-001,..." }`.

The backend should receive CSV text, not uploaded files.

### 3.3 NO multi-tenant architecture

Do not introduce multi-tenancy.

This means:

- No organizations.
- No workspaces table.
- No tenant ID.
- No company subdomains.
- No tenant-aware middleware.
- No tenant-scoped database filters.
- No SaaS billing assumptions.

Linia MVP is a single-workspace utility.

### 3.4 NO complex Role-Based Access Control

Do not implement complex RBAC.

This means:

- No permission matrix.
- No granular permissions.
- No role hierarchy.
- No teams.
- No invite flow.
- No public signup.
- No policy engine.

Use one simple seeded admin/operator account for the MVP.

A minimal `User` model is acceptable for authentication and audit attribution, but do not build role complexity.

## 4. Standard Operating Procedure (SOP)

Follow this sequence for all implementation work.

### 4.1 Documentation-first rule

Before generating application code, confirm the relevant project knowledge exists and is stable.

The expected foundational documents are:

- `docs/PRD.md`
- `docs/API_CONTRACT.md`
- `docs/DATABASE.md`
- `docs/DECISIONS.md`
- `docs/DESIGN.md`
- `docs/TODO.md`

If these files do not exist, help create or refine them before implementing production code.

### 4.2 Mandatory blocking rule

DO NOT generate NestJS services or Angular components until the user has explicitly confirmed that the API contracts and Prisma schema draft are finalized in the project knowledge.

This rule is strict.

Allowed before confirmation:

- Repository scaffolding suggestions.
- Documentation drafts.
- API contract drafts.
- Prisma schema drafts.
- Architecture explanations.
- Test plan drafts.
- File tree proposals.
- Pseudocode.
- Review comments.

Not allowed before confirmation:

- NestJS service implementation.
- NestJS controller implementation that depends on unstable contracts.
- Angular component implementation.
- Angular data-access implementation.
- Prisma migration implementation.
- Full feature implementation.

### 4.3 Ask before expanding scope

If a requested implementation appears to require excluded features, stop and ask for confirmation.

Examples:

- WebSockets
- File uploads
- Multi-tenancy
- RBAC
- Workflow builders
- Slack integrations
- Email notifications
- Advanced analytics
- Drag-and-drop graph builders
- Cloud storage
- Background jobs
- Redis
- Kubernetes

Default answer: simplify.

### 4.4 Prefer small patches

When generating code, prefer small, reviewable changes.

Do not rewrite large parts of the repository unless explicitly requested.

For each task:

1. State the files that should change.
2. Keep the implementation narrow.
3. Add or update tests where relevant.
4. Avoid clever abstractions.
5. Preserve existing project structure.

## 5. Product Rules

Linia MVP must remain intentionally small.

Build this:

- One workspace.
- One admin/operator login.
- Template planning.
- CSV text import.
- Simple task dependencies.
- Live run execution.
- Text-only evidence.
- Dependency blocking.
- Append-only audit ledger.
- Three main screens:
  - Planning
  - Execution
  - Audit
- Hostinger VPS deployment.

Do not build this:

- SaaS platform.
- Organization management.
- Multiple workspaces.
- Advanced RBAC.
- Public signup.
- Billing.
- Marketplace.
- Notification engine.
- Drag-and-drop workflow builder.
- Realtime collaboration.
- File storage product.
- Integration platform.

## 6. Backend Rules

Backend application: `apps/api`

Framework: NestJS

The backend owns business correctness.

Angular may disable buttons and improve UX, but NestJS must enforce every rule.

### 6.1 NestJS module boundaries

Expected backend modules:

```text
apps/api/src/
├─ auth/
├─ templates/
├─ runs/
├─ evidence/
├─ audit/
├─ prisma/
├─ health/
└─ common/
```

The most important domain service is the dependency engine.

Expected location:

```text
apps/api/src/runs/dependency-engine.service.ts
```

It should own logic such as:

- `canStartTask()`
- `canCompleteTask()`
- `recalculateRunTaskStatuses()`
- `findBlockingTasks()`

### 6.2 Controller rules

Controllers must stay thin.

Controllers should:

- Accept requests.
- Validate DTOs.
- Call services.
- Return responses.

Controllers should not contain business rules.

### 6.3 Service rules

Services should contain business logic.

Keep services focused and readable.

Use explicit names over generic abstractions.

Avoid introducing event buses, background queues, or complex domain frameworks.

### 6.4 DTO and validation rules

Use DTOs for request validation.

Use NestJS `ValidationPipe` globally with strict settings:

- `transform: true`
- `whitelist: true`
- `forbidNonWhitelisted: true`

Do not use `any` unless there is a clear, justified reason.

### 6.5 Prisma transaction rules

Use Prisma transactions for state transitions.

Any operation that changes a run task status must happen in a transaction that also writes the related audit entry.

Required transition behavior:

- Start task:
  - Validate task exists.
  - Validate task is `READY`.
  - Validate dependencies are complete.
  - Set status to `IN_PROGRESS`.
  - Write audit entry.
- Add evidence:
  - Validate task exists.
  - Validate content is non-empty text.
  - Save text evidence.
  - Write audit entry.
- Complete task:
  - Validate task exists.
  - Validate status is `IN_PROGRESS`.
  - If evidence is required, validate text evidence exists.
  - Set status to `COMPLETED`.
  - Write audit entry.
  - Recalculate downstream statuses.
- Fail task:
  - Validate task exists.
  - Set status to `FAILED`.
  - Write audit entry.
  - Ensure downstream tasks remain blocked unless their dependencies are completed.

### 6.6 Audit rules

Audit entries are append-only.

Do not create:

- Update audit endpoint.
- Delete audit endpoint.
- Edit audit UI.
- Audit mutation service.

All state-changing services must call the audit service or write audit entries inside the same transaction.

Application code must never update or delete `AuditEntry`.

## 7. Frontend Rules

Frontend application: `apps/web`

Framework: Angular

Use:

- Standalone components.
- Feature-based folders.
- Typed reactive forms.
- Angular signals for local UI state where useful.
- Functional interceptors for API/session behavior.
- Route guards for authenticated pages.

Expected frontend structure:

```text
apps/web/src/app/
├─ core/
│  ├─ api/
│  ├─ auth/
│  ├─ guards/
│  ├─ interceptors/
│  └─ layout/
├─ features/
│  ├─ planning/
│  ├─ execution/
│  └─ audit/
└─ shared/
   ├─ components/
   ├─ ui/
   ├─ models/
   └─ utils/
```

### 7.1 Main screens

Implement only these main screens for MVP:

- `/login`
- `/planning`
- `/execution`
- `/audit`

Avoid additional product areas unless explicitly approved.

### 7.2 Polling rule

The execution board must use 5-second polling.

Do not use WebSockets.

The UI should refresh immediately after user actions, then continue polling.

### 7.3 UI responsibility

The UI should make business rules visible:

- Blocked tasks must look blocked.
- Blocked tasks should explain why they are blocked.
- Start buttons must be disabled for blocked tasks.
- Complete must require text evidence when evidence is required.
- Audit must be read-only.

But the UI is not the source of truth.
The backend must enforce everything.

## 8. Design System Rules

Linia uses a "Mission Control" design style.

The UI should feel:

- Dense.
- Technical.
- Calm.
- High-contrast.
- Operational.
- Built for engineers during high-pressure cutovers.

Use:

- Dark Obsidian-style surfaces.
- Sharp grid lines.
- Compact tables.
- 32px-ish dense rows where practical.
- Functional color only.
- Status badges.
- Monospace labels for IDs, timestamps, and statuses.

Avoid:

- Playful styling.
- Excessive animation.
- Rounded bubbly cards.
- Marketing-page aesthetics.
- Large whitespace-heavy consumer SaaS layouts.

Key status colors should map clearly:

- `READY`: primary/electric blue.
- `IN_PROGRESS`: warning/amber.
- `COMPLETED`: success/emerald.
- `FAILED`: error/ruby.
- `BLOCKED`: muted/disabled with clear blocker indication.

The full design system to follow is described in `docs/DESIGN.md`.

## 9. API Rules

Keep the API REST-based and boring.

Preferred MVP endpoints:

```text
POST /auth/login
POST /auth/logout
GET /auth/me

GET /templates
POST /templates
GET /templates/:id
POST /templates/:id/tasks
PATCH /templates/:id/tasks/:taskId
POST /templates/:id/dependencies
POST /templates/import-csv-text

POST /runs
GET /runs
GET /runs/:runId
GET /runs/:runId/board
POST /runs/:runId/tasks/:taskId/start
POST /runs/:runId/tasks/:taskId/evidence
POST /runs/:runId/tasks/:taskId/complete
POST /runs/:runId/tasks/:taskId/fail
GET /runs/:runId/audit

GET /health/live
GET /health/ready
```

Do not add GraphQL.

Do not add WebSockets.

Do not add generic workflow APIs.

## 10. Database Rules

Use Prisma migrations for schema changes.

Do not manually change the production database outside migrations unless explicitly approved.

The run must snapshot template tasks and dependencies at launch time.

Reason:

- A template can change later.
- A run must preserve what was actually executed.
- Audit history must remain consistent.

Required snapshot models:

- `RunTask`
- `RunTaskDependency`

### 10.1 Evidence model

Evidence is text-only.

Do not add:

- `fileUrl`
- `fileName`
- `mimeType`
- `fileHash`
- `storageKey`
- upload metadata

A simple `content` field is enough for MVP.

### 10.2 Audit model

Audit must support:

- run ID
- optional run task ID
- optional actor user ID
- event type/action
- from status
- to status
- message
- metadata JSON
- timestamp

Audit must be append-only at application level.

A SQL trigger to prevent update/delete may be proposed, but do not add it until the schema draft is confirmed.

## 11. Testing Rules

Testing should protect the business-critical path.

Prioritize tests for:

- Dependency calculation.
- Task status transitions.
- Evidence gate.
- Audit writing.
- CSV text import validation.
- Golden path E2E.

Minimum dependency engine tests:

- Task with no dependencies becomes `READY`.
- Task with incomplete dependency remains `BLOCKED`.
- Task unlocks when all dependencies are `COMPLETED`.
- Failed predecessor does not unlock downstream task.
- Required-evidence task cannot complete without evidence.
- Completing a task writes an audit entry.

Golden path Playwright test:

1. Login.
2. Import or create a template.
3. Define at least one dependency.
4. Launch a run.
5. Verify dependent task is blocked.
6. Complete predecessor with text evidence.
7. Verify dependent task unlocks.
8. Open audit screen.
9. Verify immutable audit rows exist.

## 12. Git and Review Rules

Use short-lived branches.

Preferred branch names:

```text
feature/template-crud
feature/csv-text-import
feature/dependency-engine
feature/run-execution
feature/audit-ledger
fix/evidence-gate
```

Before suggesting a merge, verify:

- Code matches the PRD.
- No excluded feature was added.
- Backend rules are enforced server-side.
- Prisma migrations are included when schema changes.
- Tests are added or updated.
- No secrets are committed.
- The change is small enough to review.

## 13. AI Behavior Rules

When helping in this repository:

- Be direct.
- Protect scope.
- Prefer the simplest solution that ships.
- Do not introduce infrastructure without strong justification.
- Do not generate large code dumps before contracts are stable.
- Ask for confirmation when requirements conflict.
- Flag contradictions in project documents.
- Favor server-side correctness over frontend-only behavior.
- Favor readable code over clever abstractions.

When asked to implement a feature, first check whether it violates:

- No WebSockets.
- No file uploads.
- No multi-tenancy.
- No complex RBAC.
- No platform scope.

If it violates these constraints, stop and propose the MVP-safe alternative.

## 14. Definition of Done

A task is done only when:

- It fits the MVP scope.
- It respects the strict architectural constraints.
- Backend business rules are enforced server-side.
- The relevant tests pass.
- Audit behavior is preserved.
- The UI follows the Mission Control design direction.
- No secrets are committed.
- No excluded features were introduced.
- The implementation remains understandable for a solo developer maintaining the project after a 9-5 job.

## 15. Final Build Rule

Do not build a platform.

Build:

- One admin.
- One workspace.
- CSV text import.
- Text evidence.
- Dependency blocking.
- Append-only audit ledger.
- Planning screen.
- Execution screen.
- Audit screen.
- One VPS deployment.

That is enough for the Linia MVP.

These rules now govern all future prompts in this chat for Linia unless you explicitly override them.
