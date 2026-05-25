# DECISIONS.md — Linia MVP Architecture Decisions

This document records the architectural and product decisions for the Linia MVP.

The goal is to prevent scope drift, keep AI-generated code aligned, and make future changes intentional.

---

## 1. Decision Log Format

Each decision should follow this format:

```markdown
## ADR-000 — Decision Title

**Status:** Accepted | Proposed | Superseded  
**Date:** YYYY-MM-DD  
**Context:** Why this decision exists.  
**Decision:** What we chose.  
**Consequences:** What this enables and what trade-offs it creates.
```

---

## ADR-001 — Build a Strict Single-Workspace MVP

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-001 Context

Linia must be shipped by a solo developer in roughly 3 months while maintaining a full-time job, gym schedule, social time, commute time, and normal home responsibilities.

The MVP must prove one business loop:

1. Create/import a cutover checklist.
2. Define simple dependencies.
3. Launch a live run.
4. Enforce dependency blocking.
5. Require text evidence.
6. Write an immutable audit trail.

### ADR-001 Decision

Linia MVP will be a single-workspace application.

No multi-tenancy will be implemented.

### ADR-001 Consequences

This removes the need for:

- Organization tables.
- Workspace tables.
- Tenant IDs.
- Tenant middleware.
- Company subdomains.
- Tenant-aware permissions.
- Tenant-specific billing.

This keeps the MVP focused and shippable.

---

## ADR-002 — Use Angular + NestJS + PostgreSQL + Prisma

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-002 Context

The project should use a stack that matches the developer’s current strengths and supports AI-assisted development.

The selected stack should be structured, TypeScript-first, and suitable for a maintainable MVP.

### ADR-002 Decision

Use:

- Angular for the frontend.
- NestJS for the backend.
- PostgreSQL for the database.
- Prisma for schema, migrations, and typed database access.
- Playwright for end-to-end testing.
- Docker Compose for local and production deployment.
- Hostinger VPS for initial production hosting.

### ADR-002 Consequences

Benefits:

- One primary language: TypeScript.
- Angular and NestJS both encourage structured architecture.
- Prisma gives typed database access and migration history.
- PostgreSQL gives strong relational guarantees.
- Docker Compose works well for Hostinger VPS deployment.

Trade-offs:

- More initial structure than a simple full-stack framework.
- Requires maintaining separate frontend and backend apps.
- Requires careful API contract discipline.

---

## ADR-003 — Use pnpm Workspaces Monorepo

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-003 Context

Linia needs one repository that is easy for a solo developer and AI tools to understand.

Splitting the frontend, backend, and shared types into separate repositories would add coordination overhead.

### ADR-003 Decision

Use one monorepo with `pnpm workspaces`.

Expected structure:

```text
linia/
├─ .codex/
├─ apps/
│  ├─ api/
│  └─ web/
├─ packages/
│  └─ shared/
├─ docs/
├─ infra/
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

### ADR-003 Consequences

Benefits:

- Shared scripts.
- Shared TypeScript types.
- Easier local development.
- Easier AI context.
- Easier CI setup.

Trade-offs:

- Requires workspace-aware scripts.
- Requires discipline around package boundaries.

---

## ADR-004 — Use Bootstrap 5.3 Only for UI Styling

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-004 Context

The UI needs to be built quickly and consistently.

The project briefly considered Tailwind v4, but using both Bootstrap and Tailwind would add unnecessary styling complexity and decision overhead.

### ADR-004 Decision

Use Bootstrap 5.3 as the only frontend styling framework.

Use:

- Bootstrap 5.3 components.
- Bootstrap Icons.
- Custom Sass entrypoint for Linia theme tokens.
- CSS variables and `data-bs-theme="linia"` for theme customization.
- Custom Linia classes only where Bootstrap components need product-specific styling.

Do not use Tailwind.

### ADR-004 Consequences

Benefits:

- Faster UI assembly.
- Fewer styling decisions.
- Less CSS tooling complexity.
- Easier solo maintenance.
- Easier consistency across Angular screens.

Trade-offs:

- Less utility-class flexibility than Tailwind.
- Some custom CSS/Sass will be needed for the Mission Control design language.

---

## ADR-005 — Use REST API Only

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-005 Context

Linia needs predictable, testable communication between Angular and NestJS.

The MVP does not need GraphQL or complex realtime infrastructure.

### ADR-005 Decision

Use a REST API.

Do not use:

- GraphQL.
- WebSockets.
- Socket.IO.
- Server-Sent Events.
- gRPC.
- tRPC.

### ADR-005 Consequences

Benefits:

- Simple HTTP endpoints.
- Easy testing with Supertest and Playwright.
- Easy documentation with API contract markdown and Swagger/OpenAPI later.
- Easier debugging.

Trade-offs:

- More explicit endpoint design.
- Some response DTOs must be carefully maintained.

---

## ADR-006 — Use 5-Second Polling Instead of WebSockets

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-006 Context

The live execution board needs to update without manual page refresh.

However, WebSockets would add extra infrastructure, state handling, and deployment complexity.

### ADR-006 Decision

Use simple HTTP polling every 5 seconds on the Angular execution board.

Expected behavior:

- Poll `GET /runs/:runId/board` every 5 seconds.
- Refresh immediately after user actions.
- Stop polling when the component is destroyed.
- Avoid WebSockets entirely for MVP.

### ADR-006 Consequences

Benefits:

- Simpler backend.
- Simpler deployment.
- No sticky sessions.
- No realtime gateway.
- No Redis/pub-sub.

Trade-offs:

- Updates are not instant across browser sessions.
- Slightly more repeated HTTP traffic.
- Good enough for MVP and a single-team operational tool.

---

## ADR-007 — No File Uploads in MVP

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-007 Context

The original product idea mentioned uploaded evidence and CSV/spreadsheet import.

File uploads would require storage, validation, file-size limits, MIME handling, backup concerns, and security checks.

This is too much for the MVP.

### ADR-007 Decision

Do not implement backend file uploads.

Evidence is text-only.

CSV import must be implemented as CSV text input. Accept either:

1. A textarea where the user pastes CSV.
2. A browser-side file picker that reads a local CSV file and sends the content as text in JSON.

The backend must receive CSV text, not multipart file uploads.

### ADR-007 Consequences

Benefits:

- No object storage.
- No S3.
- No multer evidence flow.
- No file antivirus/security concerns.
- Faster implementation.

Trade-offs:

- Less convenient than direct file uploads.
- Users may need to paste CSV text or use browser-side parsing.
- Acceptable for proving MVP value.

---

## ADR-008 — Use Local Session-Based Authentication

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-008 Context

The MVP needs authentication, but does not need public signup, OAuth, SSO, teams, or multiple roles.

### ADR-008 Decision

Use local session-based authentication in NestJS with Passport.

Use one seeded admin/operator account.

Do not implement:

- Public signup.
- OAuth.
- SSO.
- Refresh tokens.
- Complex RBAC.
- Team invitations.

### ADR-008 Consequences

Benefits:

- Simple login model.
- Server-controlled sessions.
- Good enough for one operator/admin MVP.
- Avoids token refresh complexity.

Trade-offs:

- Not ready for broad SaaS onboarding.
- Multi-user workflows are deferred.

---

## ADR-009 — No Complex RBAC

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-009 Context

Linia is intended to prove a workflow, not a permission system.

Complex RBAC would create many edge cases and increase testing effort.

### ADR-009 Decision

Do not implement complex role-based access control.

The MVP uses one simple admin/operator account.

A `User` table may exist for authentication and audit attribution, but not for complex permissions.

### ADR-009 Consequences

Benefits:

- Much faster development.
- Fewer tables.
- Fewer UI states.
- Fewer tests.

Trade-offs:

- No fine-grained access control.
- No separate admin/operator role behavior yet.
- Future role support must be added carefully later.

---

## ADR-010 — Template Is Editable, Run Is a Snapshot

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-010 Context

A template may change over time.

A run represents a real execution event and must preserve what was executed.

If a run referenced live template tasks directly, later template edits could corrupt the historical meaning of a run.

### ADR-010 Decision

When launching a run:

- Copy `TemplateTask` rows into `RunTask`.
- Copy `TemplateDependency` rows into `RunTaskDependency`.
- Execute the run only against snapshot tables.

### ADR-010 Consequences

Benefits:

- Historical runs remain stable.
- Audit records stay meaningful.
- Template changes do not alter live or completed runs.

Trade-offs:

- More tables.
- Slightly more launch-run logic.
- Worth it for audit correctness.

---

## ADR-011 — Dependency Rules Are Enforced Server-Side

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-011 Context

The UI can disable buttons, but users or bugs could still call backend endpoints directly.

The dependency engine is a business-critical part of Linia.

### ADR-011 Decision

NestJS must enforce all dependency rules server-side.

Angular may visually disable actions, but it is not the source of truth.

Rules:

- A task is `READY` only when all dependencies are `COMPLETED`.
- A task is `BLOCKED` when at least one dependency is not `COMPLETED`.
- A `FAILED` predecessor does not unlock downstream tasks.
- A `BLOCKED` task cannot start.
- Status recalculation happens after relevant transitions.

### ADR-011 Consequences

Benefits:

- Strong business correctness.
- Safer operational workflow.
- Easier backend unit testing.

Trade-offs:

- Backend logic requires careful service tests.
- UI must still handle API rejection states.

---

## ADR-012 — Evidence Gate Is Enforced Server-Side

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-012 Context

Evidence is one of Linia’s core proof-of-work features.

A frontend-only evidence requirement would not be reliable.

### ADR-012 Decision

NestJS must enforce the evidence gate server-side.

A task with `requiresEvidence = true` cannot move to `COMPLETED` unless at least one text evidence row exists for that task.

### ADR-012 Consequences

Benefits:

- Reliable proof-of-work enforcement.
- Stronger audit trail.
- Clear backend tests.

Trade-offs:

- Completion endpoint must query evidence before transition.
- UI must handle `EVIDENCE_REQUIRED` API errors.

---

## ADR-013 — Audit Log Is Append-Only

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-013 Context

The audit ledger is central to Linia’s governance value.

If audit rows can be edited or deleted, the product loses credibility.

### ADR-013 Decision

`AuditEntry` records are append-only.

Do not create:

- Update audit endpoint.
- Delete audit endpoint.
- Edit audit UI.
- Audit mutation workflow.

All relevant state changes must write audit entries inside the same transaction as the state change.

### ADR-013 Consequences

Benefits:

- Strong operational history.
- Clear compliance story.
- Easier trust in the timeline.

Trade-offs:

- Incorrect audit entries cannot be edited.
- Corrections must be represented by new audit entries in a future version.

---

## ADR-014 — Use Prisma Transactions for State Changes

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-014 Context

Task transitions and audit writing must stay consistent.

A task should not change status without the audit log recording it.

### ADR-014 Decision

Use Prisma transactions for state-changing operations.

Required transactional flows:

- Launch run.
- Start task.
- Add evidence.
- Complete task.
- Fail task.
- Recalculate dependent task statuses.
- Write audit entries.

### ADR-014 Consequences

Benefits:

- Consistent task and audit state.
- Easier rollback on errors.
- Safer business logic.

Trade-offs:

- Service methods require transaction-aware design.
- Tests must cover transactional behavior.

---

## ADR-015 — CSV Import Is MVP Import Format

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-015 Context

The PRD mentions replacing Excel-style cutover sheets.

Supporting full Excel parsing would add complexity.

### ADR-015 Decision

Support CSV only for MVP.

Required CSV columns:

```csv
externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn
```

The backend import receives CSV text and creates:

- `Template`
- `TemplateTask`
- `TemplateDependency`

### ADR-015 Consequences

Benefits:

- Easy to implement.
- Easy to test.
- Easy to document.
- Good enough for MVP demo and real early use.

Trade-offs:

- Users must export spreadsheets to CSV.
- No multiple-sheet parsing.
- No Excel formatting support.

---

## ADR-016 — API and Database Contracts Must Be Finalized Before Feature Code

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-016 Context

AI-generated code can move quickly but may create drift if contracts are unstable.

The project already established an AI operating rule that NestJS services and Angular components should not be generated before API contracts and Prisma schema drafts are confirmed.

### ADR-016 Decision

Before generating NestJS services or Angular components, the user must explicitly confirm that these files are finalized enough for implementation:

- `docs/API_CONTRACT.md`
- `docs/DATABASE.md`

### ADR-016 Consequences

Benefits:

- Less rework.
- More consistent AI output.
- Better alignment between frontend, backend, and database.
- Easier testing.

Trade-offs:

- Slightly slower start before coding.
- Better long-term speed because implementation has stable targets.

---

## ADR-017 — Hostinger VPS Is the Initial Deployment Target

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-017 Context

The project needs a low-cost deployment path suitable for a solo developer.

Hostinger VPS provides predictable pricing and enough control for Docker Compose.

### ADR-017 Decision

Deploy MVP to Hostinger VPS using Docker Compose.

Production stack:

- Nginx reverse proxy.
- Angular web container.
- NestJS API container.
- PostgreSQL container.
- Daily `pg_dump` backups.

### ADR-017 Consequences

Benefits:

- Low fixed cost.
- Full control.
- Simple Docker Compose mental model.
- Good enough for MVP.

Trade-offs:

- More operations responsibility than a managed PaaS.
- Must configure backups, HTTPS, firewall, and updates.
- If ops becomes too time-consuming, reassess managed hosting later.

---

## ADR-018 — Golden Path Test Is the Main MVP Quality Gate

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-018 Context

The MVP must prove the core user workflow, not broad feature coverage.

The safest way to prevent regressions is to automate the critical path.

### ADR-018 Decision

Create one Playwright Golden Path test that validates:

1. Login.
2. Import CSV text.
3. Launch run.
4. Verify dependent task is blocked.
5. Add text evidence.
6. Complete predecessor task.
7. Verify dependent task unlocks.
8. Open audit screen.
9. Verify audit entries exist.

### ADR-018 Consequences

Benefits:

- Protects the most important business flow.
- Gives confidence before deployment.
- Keeps testing focused.

Trade-offs:

- Does not cover every edge case.
- Must be supplemented with backend unit tests for dependency and evidence logic.

---

## ADR-019 — Prioritize Boring Code Over Clever Abstractions

**Status:** Accepted  
**Date:** 2026-05-25

### ADR-019 Context

The project is solo-built and AI-assisted.

Complex abstractions can slow down review, debugging, and future changes.

### ADR-019 Decision

Prefer simple, readable, explicit code.

Avoid:

- Over-generalized engines.
- Plugin architectures.
- Event-driven infrastructure.
- Dynamic workflow builders.
- Premature abstractions.
- Generic repository layers over Prisma unless clearly necessary.

### ADR-019 Consequences

Benefits:

- Easier AI review.
- Easier debugging after work hours.
- Faster implementation.
- Lower maintenance burden.

Trade-offs:

- Some duplication may exist early.
- Refactoring can happen later after the MVP proves value.

---

## 20. Current Accepted MVP Decisions Summary

| Area | Decision |
| --- | --- |
| Product scope | Single-workspace MVP |
| Frontend | Angular |
| Styling | Bootstrap 5.3 only |
| Backend | NestJS REST API |
| Database | PostgreSQL |
| ORM | Prisma |
| Monorepo | pnpm workspaces |
| Auth | Local session-based auth |
| User model | One seeded admin/operator |
| Realtime | 5-second polling |
| Evidence | Text-only |
| Import | CSV text import |
| Audit | Append-only |
| Deployment | Hostinger VPS with Docker Compose |
| E2E testing | Playwright Golden Path |
| Excluded | WebSockets, file uploads, multi-tenancy, complex RBAC |

---

## 21. Deferred Decisions

These are intentionally not part of the MVP.

| Topic | Deferred Until |
| --- | --- |
| Multi-user roles | After MVP validation |
| Multi-tenancy | After clear SaaS demand |
| File evidence uploads | After text evidence proves insufficient |
| WebSockets | After polling becomes a proven bottleneck |
| Slack/email notifications | After core execution workflow is used |
| Drag-and-drop workflow builder | After simple CSV/template flow proves value |
| Managed Postgres | After VPS operations become a burden |
| Billing | After there is a validated customer segment |
| Public signup | After onboarding strategy is defined |

---

## 22. How to Add a New Decision

When a new architectural or product decision is made:

1. Add a new ADR section.
2. Use the next number.
3. Mark status as `Proposed` first if uncertain.
4. Move to `Accepted` only after explicit confirmation.
5. If a decision changes, do not delete the old one. Mark it as `Superseded`.

---

## 23. Final Principle

Every decision must protect the 3-month MVP.

When in doubt, choose the path that helps ship:

- One admin.
- One workspace.
- CSV text import.
- Text evidence.
- Dependency blocking.
- Append-only audit ledger.
- Planning screen.
- Execution screen.
- Audit screen.
- Hostinger VPS deployment.
