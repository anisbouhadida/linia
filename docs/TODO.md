# TODO.md — Linia MVP 12-Week Roadmap

Linia MVP goal: ship a narrow, production-ready single-workspace tool for high-risk IT cutover checklist execution.

Core scope:

- One admin/operator login.
- One workspace.
- Template planning.
- CSV text import.
- Dependency blocking.
- Live run execution.
- Text-only evidence.
- Append-only audit ledger.
- Planning, Execution, and Audit screens.
- Hostinger VPS deployment.

Strict exclusions:

- No WebSockets. Use 5-second polling.
- No file uploads. CSV import must use pasted CSV text or browser-side file reading that sends CSV text as JSON.
- No multi-tenant architecture.
- No complex RBAC.
- No notification engine.
- No drag-and-drop workflow builder.

---

## Phase 1: Foundation — Weeks 1–3

**Goal:** You can log in, create a project/template, and save tasks to the database.

### Week 1 — Monorepo and Database Foundation

- [X] Initialize the monorepo using `pnpm workspaces`.
- [X] Create `apps/api` for the NestJS backend.
- [X] Create `apps/web` for the Angular standalone frontend.
- [X] Install Bootstrap 5.3 and Bootstrap Icons in the Angular app, create the Linia Bootstrap Sass theme entrypoint, and configure `data-bs-theme="linia"` in `index.html`.
- [X] Create `packages/shared` for shared TypeScript enums, DTO types, and constants.
- [X] Add root-level scripts for install, lint, test, build, and dev.
- [X] Add `.env.example`.
- [X] Add base `README.md`.
- [X] Initialize PostgreSQL via Docker Compose for local development.
- [X] Install and configure Prisma in `apps/api`.
- [X] Create initial Prisma schema models:
  - [X] `User`
  - [X] `Template`
  - [X] `TemplateTask`
- [X] Generate the first Prisma migration.
- [X] Add a seed script for the initial admin user.
- [X] Verify local database startup and Prisma connection.

**Acceptance criteria:**

- [X] `pnpm install` succeeds.
- [X] Local PostgreSQL starts with Docker.
- [X] Prisma migration runs successfully.
- [X] Seed admin user is created.
- [X] API and web apps can start locally.

---

### Week 2 — Authentication

- [X] Implement NestJS local session-based authentication using Passport.
- [X] Create a single seeded admin/operator account.
- [X] Add login endpoint.
- [X] Add logout endpoint.
- [X] Add current-user endpoint: `GET /auth/me`.
- [X] Add session middleware and secure cookie configuration.
- [X] Add backend auth guard.
- [X] Build Angular `LoginPage`.
- [X] Add Angular auth service.
- [X] Add Angular route guard for protected pages.
- [X] Add Angular functional interceptor to attach credentials.
- [X] Add basic authenticated app layout.

**Acceptance criteria:**

- [X] Admin can log in.
- [X] Admin can log out.
- [X] Protected Angular routes redirect unauthenticated users.
- [X] `GET /auth/me` returns the current user after login.
- [X] No public signup exists.

---

### Week 3 — Template and Task CRUD

- [ ] Build backend CRUD endpoints for templates.
- [ ] Build backend CRUD endpoints for template tasks.
- [ ] Add DTO validation for template and task inputs.
- [ ] Enforce server-side validation for required fields.
- [ ] Build Angular `PlanningPage`.
- [ ] Add template list UI.
- [ ] Add create-template form.
- [ ] Add manual task creation form.
- [ ] Add editable task table for a selected template.
- [ ] Add basic empty/loading/error states.

**Acceptance criteria:**

- [ ] Admin can create a template.
- [ ] Admin can add tasks manually.
- [ ] Tasks are persisted in PostgreSQL.
- [ ] Planning screen can reload saved data from the API.
- [ ] Backend validation rejects invalid payloads.

---

## Phase 2: Dependency and Import Engine — Weeks 4–6

**Goal:** Import CSV text, parse it, and calculate whether tasks are `READY` or `BLOCKED`.

### Week 4 — CSV Text Import

- [ ] Create `csv-import.service.ts` on the backend.
- [ ] Support CSV text input, not uploaded files.
- [ ] Add endpoint: `POST /templates/import-csv-text`.
- [ ] Accept payload shape similar to:

```json
{
  "templateName": "Core Migration",
  "csv": "externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn\nT-001,Check DB,,DBA,15,true,"
}
````

- [ ] Parse required CSV fields:

  - [ ] `externalId`
  - [ ] `title`
  - [ ] `dependsOn`
- [ ] Parse optional CSV fields:

  - [ ] `description`
  - [ ] `owner`
  - [ ] `estimatedMinutes`
  - [ ] `requiresEvidence`
- [ ] Validate unique `externalId`.
- [ ] Validate `dependsOn` references existing `externalId`.
- [ ] Return clear validation errors.
- [ ] Add Angular CSV import UI using a textarea.
- [ ] Optional: add a browser-side file picker that reads CSV locally and sends text as JSON.

**Acceptance criteria:**

- [ ] User can paste CSV text into Angular.
- [ ] Backend creates a template and tasks from CSV text.
- [ ] Invalid dependencies are rejected.
- [ ] No backend file-upload infrastructure is added.

---

### Week 5 — Dependency Engine

- [ ] Implement `dependency-engine.service.ts` in NestJS.
- [ ] Add dependency calculation for:

  - [ ] `READY`
  - [ ] `BLOCKED`
  - [ ] `IN_PROGRESS`
  - [ ] `COMPLETED`
  - [ ] `FAILED`
- [ ] Implement rule: a task is `READY` when all dependencies are `COMPLETED`.
- [ ] Implement rule: a task is `BLOCKED` when at least one dependency is not `COMPLETED`.
- [ ] Implement rule: a `FAILED` predecessor does not unlock downstream tasks.
- [ ] Add unit tests for dependency calculations.
- [ ] Add tests for tasks with no dependencies.
- [ ] Add tests for tasks with incomplete dependencies.
- [ ] Add tests for tasks unlocking after predecessor completion.

**Acceptance criteria:**

- [ ] Dependency engine tests pass.
- [ ] Backend can determine if a task can start.
- [ ] Backend can identify blocking tasks.
- [ ] Dependency logic is not implemented only in Angular.

---

### Week 6 — Template Dependencies and UI Lock Display

- [ ] Add `TemplateDependency` to the Prisma schema.
- [ ] Add migration for template dependencies.
- [ ] Add backend endpoint to create dependencies between template tasks.
- [ ] Add backend validation to prevent invalid dependencies.
- [ ] Prevent self-dependencies.
- [ ] Prevent duplicate dependencies.
- [ ] Update CSV import to create dependencies.
- [ ] Update Angular planning UI to show dependency relationships.
- [ ] Visually display tasks that are locked behind other tasks.
- [ ] Add simple dependency labels such as `Depends on T-001`.

**Acceptance criteria:**

- [ ] Dependencies are persisted in PostgreSQL.
- [ ] CSV import creates dependencies correctly.
- [ ] Invalid dependencies are rejected server-side.
- [ ] Planning UI clearly shows task dependencies.

---

## Phase 3: Live Run Screen and Evidence — Weeks 7–9

**Goal:** Launch a live run where buttons physically lock until dependencies and evidence requirements are satisfied.

### Week 7 — Run Launch and Execution Page

- [ ] Add Prisma models:

  - [ ] `Run`
  - [ ] `RunTask`
  - [ ] `RunTaskDependency`
- [ ] Build `POST /runs` endpoint.
- [ ] Use a Prisma transaction to snapshot template tasks into run tasks.
- [ ] Use a Prisma transaction to snapshot template dependencies into run dependencies.
- [ ] Recalculate initial run task statuses after launch.
- [ ] Add endpoint: `GET /runs/:runId/board`.
- [ ] Build Angular `ExecutionPage`.
- [ ] Display the run task matrix.
- [ ] Display task status badges.
- [ ] Display task owner, estimated duration, dependencies, and available actions.

**Acceptance criteria:**

- [ ] Admin can launch a run from a template.
- [ ] Run tasks are independent snapshots of template tasks.
- [ ] Run dependencies are independent snapshots of template dependencies.
- [ ] Execution board displays the launched run.

---

### Week 8 — State Transitions and Evidence Gate

- [ ] Implement endpoint: `POST /runs/:runId/tasks/:taskId/start`.
- [ ] Implement endpoint: `POST /runs/:runId/tasks/:taskId/evidence`.
- [ ] Implement endpoint: `POST /runs/:runId/tasks/:taskId/complete`.
- [ ] Implement endpoint: `POST /runs/:runId/tasks/:taskId/fail`.
- [ ] Use Prisma transactions for all state transitions.
- [ ] Enforce server-side rule: only `READY` tasks can start.
- [ ] Enforce server-side rule: only `IN_PROGRESS` tasks can complete.
- [ ] Enforce server-side rule: tasks requiring evidence cannot complete without text evidence.
- [ ] Enforce server-side rule: failed tasks do not unlock downstream tasks.
- [ ] Recalculate downstream statuses after completion.
- [ ] Add backend tests for transition rules.
- [ ] Add backend tests for evidence gate.

**Acceptance criteria:**

- [ ] Blocked task cannot be started via API.
- [ ] Required-evidence task cannot be completed without text evidence.
- [ ] Completed predecessor unlocks dependent task.
- [ ] Failed predecessor does not unlock dependent task.
- [ ] All transition rules are enforced in NestJS.

---

### Week 9 — Evidence UI and Polling

- [ ] Build UI for adding text-only evidence.
- [ ] Add evidence modal or inline evidence form.
- [ ] Prevent complete action in the UI until required evidence is added.
- [ ] Display evidence state on the execution board.
- [ ] Implement 5-second polling on the execution board.
- [ ] Refresh the board immediately after user actions.
- [ ] Stop polling when the execution component is destroyed.
- [ ] Avoid WebSockets or push-based realtime infrastructure.
- [ ] Add UI error handling for stale or invalid task actions.

**Acceptance criteria:**

- [ ] User can add text evidence to a task.
- [ ] UI blocks completion when evidence is required and missing.
- [ ] Execution board updates without manual reload.
- [ ] Polling interval is 5 seconds.
- [ ] No WebSocket dependency exists.

---

## Phase 4: Ledger, Polish, and Production — Weeks 10–12

**Goal:** A production-ready app hosted live with an unalterable audit log.

### Week 10 — Append-Only Audit Ledger

- [ ] Create the `AuditEntry` table.
- [ ] Add Prisma migration for audit entries.
- [ ] Create `audit.service.ts`.
- [ ] Ensure every state transition writes an audit entry.
- [ ] Write audit entries in the same transaction as task status changes.
- [ ] Add endpoint: `GET /runs/:runId/audit`.
- [ ] Do not add audit update endpoints.
- [ ] Do not add audit delete endpoints.
- [ ] Build Angular `AuditPage`.
- [ ] Display audit entries in a dense read-only table.
- [ ] Include timestamp, actor, task, action, from status, to status, and message.
- [ ] Add tests to verify audit entries are created.

**Acceptance criteria:**

- [ ] Every start, evidence, complete, and fail action writes an audit entry.
- [ ] Audit log is read-only in the UI.
- [ ] No application endpoint can edit or delete audit entries.
- [ ] Audit page shows a clear chronological ledger.

---

### Week 11 — Golden Path Testing and MVP Polish

- [ ] Write the Playwright Golden Path E2E test:

  - [ ] Login.
  - [ ] Import CSV text.
  - [ ] Launch run.
  - [ ] Verify dependent task is blocked.
  - [ ] Add text evidence.
  - [ ] Complete predecessor task.
  - [ ] Verify dependent task unlocks.
  - [ ] Open audit screen.
  - [ ] Verify audit entries exist.
- [ ] Add basic smoke tests for login and board loading.
- [ ] Fix critical UI alignment issues.
- [ ] Improve loading and error states.
- [ ] Review all MVP exclusions.
- [ ] Remove any accidental scope creep.
- [ ] Verify no secrets are committed.
- [ ] Verify production environment variables are documented.

**Acceptance criteria:**

- [ ] Golden Path test passes locally.
- [ ] Critical backend tests pass.
- [ ] Critical frontend tests pass.
- [ ] MVP scope remains narrow.
- [ ] App is ready for deployment.

---

### Week 12 — Hostinger VPS Production Deployment

- [ ] Provision a Hostinger VPS with Ubuntu and Docker.
- [ ] Configure SSH key access.
- [ ] Disable password-based root login where practical.
- [ ] Configure firewall rules for ports:

  - [ ] `22`
  - [ ] `80`
  - [ ] `443`
- [ ] Create production `.env` on the VPS.
- [ ] Create `docker-compose.prod.yml`.
- [ ] Add PostgreSQL service.
- [ ] Add NestJS API service.
- [ ] Add Angular web service.
- [ ] Add Nginx reverse proxy.
- [ ] Configure routing:

  - [ ] `/` → Angular web
  - [ ] `/api` → NestJS API
- [ ] Configure HTTPS with Let’s Encrypt.
- [ ] Run Prisma migrations in production.
- [ ] Deploy the app.
- [ ] Configure daily automated `pg_dump` database backups.
- [ ] Test backup creation.
- [ ] Test restore process at least once.
- [ ] Record deployment steps in `docs/DEPLOYMENT.md`.

**Acceptance criteria:**

- [ ] Production app is reachable over HTTPS.
- [ ] Login works in production.
- [ ] Golden Path works in production.
- [ ] Database backups run daily.
- [ ] Restore process is documented.
- [ ] Deployment is reproducible.

---

## Final MVP Verification Checklist

The MVP is complete only when this full flow works:

- [ ] Log into Linia.
- [ ] Create or import a template from CSV text.
- [ ] Create at least one dependency between tasks.
- [ ] Launch a live run.
- [ ] Confirm dependent task starts as `BLOCKED`.
- [ ] Start predecessor task.
- [ ] Add text evidence.
- [ ] Complete predecessor task.
- [ ] Confirm dependent task becomes `READY`.
- [ ] Open audit page.
- [ ] Confirm audit entries exist for each state transition.
- [ ] Confirm audit entries cannot be edited or deleted.
- [ ] Confirm app is deployed on Hostinger VPS.
- [ ] Confirm daily database backups are configured.

---

## Non-Negotiable Solo Shipping Rules

- [ ] Do not build a SaaS platform.
- [ ] Do not add multi-tenancy.
- [ ] Do not add complex RBAC.
- [ ] Do not add WebSockets.
- [ ] Do not add file uploads.
- [ ] Do not add Slack, webhook, or email notifications.
- [ ] Do not add drag-and-drop workflow builders.
- [ ] Do not add advanced analytics.
- [ ] Keep the app understandable for one developer maintaining it after a 9–5 job.
- [ ] Prioritize the Golden Path over all nice-to-have features.
