# API_CONTRACT.md — Linia MVP

Status: Draft for review  
Scope: MVP only  
API style: REST over HTTP  
Realtime strategy: 5-second polling from Angular  
Authentication: local session-based authentication  
Evidence strategy: text-only evidence  
CSV strategy: CSV text sent as JSON, no backend file-upload infrastructure

---

## 1. Contract Principles

Linia is a single-workspace MVP for high-risk IT cutover checklist execution.

The API must stay intentionally boring, explicit, and server-authoritative.

### Mandatory API rules

- Use REST endpoints only.
- Do not use GraphQL.
- Do not use WebSockets.
- Do not use Server-Sent Events.
- Do not add backend file-upload endpoints.
- Do not add multi-tenant fields or organization scoping.
- Do not add complex RBAC.
- Do not add public signup.
- Do not add Slack, webhook, or email notification endpoints.
- Do not expose update or delete endpoints for audit entries.

### Server authority rule

Angular may disable buttons and guide the user, but NestJS must enforce all business rules server-side.

Backend must enforce:

- Blocked tasks cannot start.
- Only `READY` tasks can start.
- Only `IN_PROGRESS` tasks can complete.
- Tasks requiring evidence cannot complete unless text evidence exists.
- Failed tasks do not unlock downstream tasks.
- Every state transition writes an append-only audit entry.

---

## 2. Base URLs

### Local development

```text
Web: http://localhost:4200
API: http://localhost:3000
```

### Production

Recommended Hostinger VPS routing:

```text
Web: https://your-domain.com
API: https://your-domain.com/api
```

Angular should use an environment variable such as:

```text
API_BASE_URL=http://localhost:3000
```

or in production:

```text
API_BASE_URL=https://your-domain.com/api
```

---

## 3. Authentication Model

Authentication is local and session-based.

MVP assumptions:

- One seeded admin/operator account.
- No public signup.
- No teams.
- No roles beyond the single MVP operator concept.
- No invite system.
- No OAuth.
- No SSO.

The API uses an HTTP-only session cookie.

Angular must send credentials with API requests.

Environment contract for session configuration:

- Local development should use `NODE_ENV=development`.
- Local development should use `SESSION_STORE_DRIVER=memory`.
- Local development may leave `SESSION_STORE_DATABASE_URL` empty because the
  in-memory session store does not use it.
- Production must use `NODE_ENV=production`.
- Production deployments must use a persistent session store with
  `SESSION_STORE_DRIVER=postgres`.
- Production must set `SESSION_STORE_DATABASE_URL` to a shared PostgreSQL
  database connection string.
- Production startup fails if the persistent store is not configured.

Example Angular expectation:

```ts
withCredentials: true
```

---

## 4. Common HTTP Rules

### Content type

Most requests use:

```http
Content-Type: application/json
```

### Success response format

For single resources:

```json
{
  "data": {}
}
```

For lists:

```json
{
  "data": [],
  "meta": {
    "total": 0
  }
}
```

For commands that do not need a body:

```http
204 No Content
```

### Error response format

All API errors should follow a predictable shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": []
  }
}
```

### Common error codes

| HTTP Status | Code | Meaning |
| ---: | --- | --- |
| 400 | `BAD_REQUEST` | Invalid request shape |
| 401 | `UNAUTHENTICATED` | User is not logged in |
| 403 | `FORBIDDEN` | User cannot access the resource |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | State conflict or stale data |
| 422 | `VALIDATION_ERROR` | Business validation failed |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### Business error codes

| HTTP Status | Code | Meaning |
| ---: | --- | --- |
| 409 | `TASK_BLOCKED` | Task cannot start because dependencies are incomplete |
| 409 | `INVALID_STATUS_TRANSITION` | Requested status transition is not allowed |
| 409 | `STALE_VERSION` | Client acted on an outdated task version |
| 422 | `EVIDENCE_REQUIRED` | Task requires text evidence before completion |
| 422 | `INVALID_DEPENDENCY` | Dependency is invalid |
| 422 | `DUPLICATE_EXTERNAL_ID` | CSV contains duplicate task identifiers |
| 422 | `UNKNOWN_DEPENDENCY_REFERENCE` | CSV depends on an unknown task identifier |
| 422 | `EMPTY_CSV` | CSV content is empty |
| 422 | `INVALID_CSV_HEADER` | CSV header is missing required columns |

---

## 5. Shared Enums

These enums should also exist in `packages/shared` when implementation starts.

### `RunTaskStatus`

```ts
export type RunTaskStatus =
  | 'BLOCKED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED';
```

### `RunStatus`

```ts
export type RunStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ABORTED';
```

### `AuditEventType`

```ts
export type AuditEventType =
  | 'RUN_LAUNCHED'
  | 'TASK_READY'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'EVIDENCE_ADDED'
  | 'RUN_COMPLETED'
  | 'RUN_ABORTED';
```

---

## 6. Shared Resource Shapes

### `UserDto`

```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "displayName": "Admin",
  "createdAt": "2026-05-25T10:00:00.000Z"
}
```

### `TemplateSummaryDto`

```json
{
  "id": "uuid",
  "name": "Database Migration Cutover",
  "description": "Core production migration checklist",
  "taskCount": 5,
  "createdAt": "2026-05-25T10:00:00.000Z",
  "updatedAt": "2026-05-25T10:00:00.000Z"
}
```

### `TemplateTaskDto`

```json
{
  "id": "uuid",
  "templateId": "uuid",
  "externalId": "T-001",
  "title": "Check database connectivity",
  "description": "Confirm primary and replica connectivity before migration.",
  "owner": "DBA",
  "estimatedMinutes": 15,
  "orderIndex": 1,
  "requiresEvidence": true,
  "dependsOn": []
}
```

### `TemplateDetailDto`

```json
{
  "id": "uuid",
  "name": "Database Migration Cutover",
  "description": "Core production migration checklist",
  "createdAt": "2026-05-25T10:00:00.000Z",
  "updatedAt": "2026-05-25T10:00:00.000Z",
  "tasks": [
    {
      "id": "uuid",
      "templateId": "uuid",
      "externalId": "T-001",
      "title": "Check database connectivity",
      "description": null,
      "owner": "DBA",
      "estimatedMinutes": 15,
      "orderIndex": 1,
      "requiresEvidence": true,
      "dependsOn": []
    }
  ]
}
```

### `RunSummaryDto`

```json
{
  "id": "uuid",
  "templateId": "uuid",
  "name": "Production Migration Run",
  "status": "ACTIVE",
  "taskCount": 5,
  "completedTaskCount": 0,
  "startedAt": "2026-05-25T22:00:00.000Z",
  "completedAt": null,
  "createdAt": "2026-05-25T22:00:00.000Z"
}
```

### `RunTaskDto`

```json
{
  "id": "uuid",
  "runId": "uuid",
  "templateTaskId": "uuid",
  "externalId": "T-001",
  "title": "Check database connectivity",
  "description": null,
  "owner": "DBA",
  "estimatedMinutes": 15,
  "orderIndex": 1,
  "requiresEvidence": true,
  "status": "READY",
  "version": 0,
  "startedAt": null,
  "completedAt": null,
  "failedAt": null,
  "dependsOn": [],
  "blockingTaskIds": [],
  "evidenceCount": 0,
  "canStart": true,
  "canComplete": false
}
```

### `RunBoardDto`

```json
{
  "run": {
    "id": "uuid",
    "templateId": "uuid",
    "name": "Production Migration Run",
    "status": "ACTIVE",
    "startedAt": "2026-05-25T22:00:00.000Z",
    "completedAt": null
  },
  "summary": {
    "total": 5,
    "blocked": 4,
    "ready": 1,
    "inProgress": 0,
    "completed": 0,
    "failed": 0
  },
  "tasks": []
}
```

### `EvidenceDto`

```json
{
  "id": "uuid",
  "runTaskId": "uuid",
  "content": "Connectivity verified from app server and migration host.",
  "createdById": "uuid",
  "createdAt": "2026-05-25T22:05:00.000Z"
}
```

### `AuditEntryDto`

```json
{
  "id": "uuid",
  "runId": "uuid",
  "runTaskId": "uuid",
  "actorId": "uuid",
  "eventType": "TASK_STARTED",
  "fromStatus": "READY",
  "toStatus": "IN_PROGRESS",
  "message": "Task T-001 started by Admin.",
  "metadata": {
    "externalId": "T-001",
    "version": 1
  },
  "createdAt": "2026-05-25T22:03:00.000Z"
}
```

---

## 7. Authentication Endpoints

### `POST /auth/login`

Starts an authenticated session.

#### POST /auth/login Request

```json
{
  "email": "admin@example.com",
  "password": "change-me"
}
```

#### POST /auth/login Success Response

```http
200 OK
```

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "displayName": "Admin",
      "createdAt": "2026-05-25T10:00:00.000Z"
    }
  }
}
```

#### POST /auth/login Errors

| Status | Code |
| ---: | --- |
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHENTICATED` |

---

### `POST /auth/logout`

Destroys the current session.

#### POST /auth/logout Request

No request body.

#### POST /auth/logout Success Response

```http
204 No Content
```

---

### `GET /auth/me`

Returns the current authenticated user.

#### GET /auth/me Success Response

```http
200 OK
```

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "displayName": "Admin",
      "createdAt": "2026-05-25T10:00:00.000Z"
    }
  }
}
```

#### GET /auth/me Errors

| Status | Code |
| ---: | --- |
| 401 | `UNAUTHENTICATED` |

---

## 8. Template Endpoints

### `GET /templates`

Returns all templates.

#### GET /templates Success Response

```http
200 OK
```

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Database Migration Cutover",
      "description": "Core production migration checklist",
      "taskCount": 5,
      "createdAt": "2026-05-25T10:00:00.000Z",
      "updatedAt": "2026-05-25T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

### `POST /templates`

Creates a template.

#### POST /templates Request

```json
{
  "name": "Database Migration Cutover",
  "description": "Core production migration checklist"
}
```

#### POST /templates Validation

| Field | Required | Rules |
| --- | ---: | --- |
| `name` | Yes | string, 1-160 chars |
| `description` | No | string, max 1000 chars |

#### POST /templates Success Response

```http
201 Created
```

```json
{
  "data": {
    "id": "uuid",
    "name": "Database Migration Cutover",
    "description": "Core production migration checklist",
    "createdAt": "2026-05-25T10:00:00.000Z",
    "updatedAt": "2026-05-25T10:00:00.000Z",
    "tasks": []
  }
}
```

---

### `GET /templates/:templateId`

Returns template detail with tasks and dependencies.

#### GET /templates/:templateId Success Response

```http
200 OK
```

```json
{
  "data": {
    "id": "uuid",
    "name": "Database Migration Cutover",
    "description": "Core production migration checklist",
    "createdAt": "2026-05-25T10:00:00.000Z",
    "updatedAt": "2026-05-25T10:00:00.000Z",
    "tasks": [
      {
        "id": "uuid",
        "templateId": "uuid",
        "externalId": "T-001",
        "title": "Check database connectivity",
        "description": null,
        "owner": "DBA",
        "estimatedMinutes": 15,
        "orderIndex": 1,
        "requiresEvidence": true,
        "dependsOn": []
      }
    ]
  }
}
```

#### GET /templates/:templateId Errors

| Status | Code |
| ---: | --- |
| 404 | `NOT_FOUND` |

---

### `POST /templates/:templateId/tasks`

Creates a task inside a template.

#### POST /templates/:templateId/tasks Request

```json
{
  "externalId": "T-001",
  "title": "Check database connectivity",
  "description": "Confirm DB connectivity before migration.",
  "owner": "DBA",
  "estimatedMinutes": 15,
  "orderIndex": 1,
  "requiresEvidence": true
}
```

#### POST /templates/:templateId/tasks Validation

| Field | Required | Rules |
| --- | ---: | --- |
| `externalId` | Yes | string, 1-64 chars, unique within template |
| `title` | Yes | string, 1-160 chars |
| `description` | No | string, max 2000 chars |
| `owner` | No | string, max 120 chars |
| `estimatedMinutes` | No | positive integer |
| `orderIndex` | Yes | positive integer, unique within template |
| `requiresEvidence` | Yes | boolean |

#### POST /templates/:templateId/tasks Success Response

```http
201 Created
```

```json
{
  "data": {
    "id": "uuid",
    "templateId": "uuid",
    "externalId": "T-001",
    "title": "Check database connectivity",
    "description": "Confirm DB connectivity before migration.",
    "owner": "DBA",
    "estimatedMinutes": 15,
    "orderIndex": 1,
    "requiresEvidence": true,
    "dependsOn": []
  }
}
```

---

### `PATCH /templates/:templateId/tasks/:taskId`

Updates a template task before it is used to launch a run.

This does not mutate existing runs.

#### PATCH /templates/:templateId/tasks/:taskId Request

All fields are optional.

```json
{
  "title": "Check primary database connectivity",
  "description": "Confirm primary and replica connectivity before migration.",
  "owner": "DBA",
  "estimatedMinutes": 20,
  "orderIndex": 1,
  "requiresEvidence": true
}
```

#### PATCH /templates/:templateId/tasks/:taskId Success Response

```http
200 OK
```

```json
{
  "data": {
    "id": "uuid",
    "templateId": "uuid",
    "externalId": "T-001",
    "title": "Check primary database connectivity",
    "description": "Confirm primary and replica connectivity before migration.",
    "owner": "DBA",
    "estimatedMinutes": 20,
    "orderIndex": 1,
    "requiresEvidence": true,
    "dependsOn": []
  }
}
```

---

### `POST /templates/:templateId/dependencies`

Creates a dependency between two template tasks.

Meaning: `taskId` cannot start until `dependsOnTaskId` is completed.

#### POST /templates/:templateId/dependencies Request

```json
{
  "taskId": "uuid",
  "dependsOnTaskId": "uuid"
}
```

#### POST /templates/:templateId/dependencies Validation

- `taskId` and `dependsOnTaskId` must exist in the same template.
- `taskId` cannot equal `dependsOnTaskId`.
- Duplicate dependencies are not allowed.

#### POST /templates/:templateId/dependencies Success Response

```http
201 Created
```

```json
{
  "data": {
    "id": "uuid",
    "templateId": "uuid",
    "taskId": "uuid",
    "dependsOnTaskId": "uuid"
  }
}
```

#### POST /templates/:templateId/dependencies Errors

| Status | Code |
| ---: | --- |
| 404 | `NOT_FOUND` |
| 422 | `INVALID_DEPENDENCY` |
| 409 | `CONFLICT` |

---

### `POST /templates/import-csv-text`

Imports a template from CSV text.

This endpoint must not use multipart upload.

The frontend may provide a file picker that reads a `.csv` file locally in the browser, but the API receives plain CSV text inside JSON.

#### POST /templates/import-csv-text Request

```json
{
  "templateName": "Database Migration Cutover",
  "description": "Imported from CSV text.",
  "csv": "externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn\nT-001,Check database connectivity,,DBA,15,true,\nT-002,Run migration script,,SYS_ADMIN,45,true,T-001"
}
```

#### POST /templates/import-csv-text Required CSV Columns

```text
externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn
```

#### POST /templates/import-csv-text CSV Rules

- `externalId` is required.
- `title` is required.
- `dependsOn` is optional.
- `dependsOn` references another `externalId`.
- Multiple dependencies may be supported later, but MVP should prefer one dependency per task.
- Duplicate `externalId` values are rejected.
- Unknown `dependsOn` references are rejected.
- Excel import is not supported in MVP.
- Backend file upload is not supported in MVP.

#### POST /templates/import-csv-text Success Response

```http
201 Created
```

```json
{
  "data": {
    "template": {
      "id": "uuid",
      "name": "Database Migration Cutover",
      "description": "Imported from CSV text.",
      "taskCount": 2,
      "dependencyCount": 1,
      "createdAt": "2026-05-25T10:00:00.000Z",
      "updatedAt": "2026-05-25T10:00:00.000Z"
    }
  }
}
```

#### POST /templates/import-csv-text Errors

| Status | Code |
| ---: | --- |
| 422 | `EMPTY_CSV` |
| 422 | `INVALID_CSV_HEADER` |
| 422 | `DUPLICATE_EXTERNAL_ID` |
| 422 | `UNKNOWN_DEPENDENCY_REFERENCE` |
| 422 | `VALIDATION_ERROR` |

---

## 9. Run Endpoints

### `POST /runs`

Launches a run from a template.

A run snapshots template tasks and dependencies at launch time.

Later template edits must not change an existing run.

#### POST /runs Request

```json
{
  "templateId": "uuid",
  "name": "Production Migration Run"
}
```

#### POST /runs Validation

| Field | Required | Rules |
| --- | ---: | --- |
| `templateId` | Yes | existing template ID |
| `name` | Yes | string, 1-160 chars |

#### POST /runs Server Behavior

Inside one Prisma transaction:

1. Load the template with tasks and dependencies.
2. Create `Run`.
3. Copy `TemplateTask` rows into `RunTask` rows.
4. Copy `TemplateDependency` rows into `RunTaskDependency` rows.
5. Recalculate initial task statuses.
6. Write `RUN_LAUNCHED` audit entry.
7. Return run detail or board data.

#### POST /runs Success Response

```http
201 Created
```

```json
{
  "data": {
    "id": "uuid",
    "templateId": "uuid",
    "name": "Production Migration Run",
    "status": "ACTIVE",
    "startedAt": "2026-05-25T22:00:00.000Z",
    "completedAt": null,
    "createdAt": "2026-05-25T22:00:00.000Z"
  }
}
```

---

### `GET /runs`

Returns all runs.

#### GET /runs Success Response

```http
200 OK
```

```json
{
  "data": [
    {
      "id": "uuid",
      "templateId": "uuid",
      "name": "Production Migration Run",
      "status": "ACTIVE",
      "taskCount": 5,
      "completedTaskCount": 0,
      "startedAt": "2026-05-25T22:00:00.000Z",
      "completedAt": null,
      "createdAt": "2026-05-25T22:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

### `GET /runs/:runId`

Returns run detail.

#### GET /runs/:runId Success Response

```http
200 OK
```

```json
{
  "data": {
    "id": "uuid",
    "templateId": "uuid",
    "name": "Production Migration Run",
    "status": "ACTIVE",
    "startedAt": "2026-05-25T22:00:00.000Z",
    "completedAt": null,
    "createdAt": "2026-05-25T22:00:00.000Z"
  }
}
```

---

### `GET /runs/:runId/board`

Returns the live execution board.

Angular must poll this endpoint every 5 seconds while the execution page is active.

#### GET /runs/:runId/board Success Response

```http
200 OK
```

```json
{
  "data": {
    "run": {
      "id": "uuid",
      "templateId": "uuid",
      "name": "Production Migration Run",
      "status": "ACTIVE",
      "startedAt": "2026-05-25T22:00:00.000Z",
      "completedAt": null
    },
    "summary": {
      "total": 2,
      "blocked": 1,
      "ready": 1,
      "inProgress": 0,
      "completed": 0,
      "failed": 0
    },
    "tasks": [
      {
        "id": "uuid",
        "runId": "uuid",
        "templateTaskId": "uuid",
        "externalId": "T-001",
        "title": "Check database connectivity",
        "description": null,
        "owner": "DBA",
        "estimatedMinutes": 15,
        "orderIndex": 1,
        "requiresEvidence": true,
        "status": "READY",
        "version": 0,
        "startedAt": null,
        "completedAt": null,
        "failedAt": null,
        "dependsOn": [],
        "blockingTaskIds": [],
        "evidenceCount": 0,
        "canStart": true,
        "canComplete": false
      },
      {
        "id": "uuid",
        "runId": "uuid",
        "templateTaskId": "uuid",
        "externalId": "T-002",
        "title": "Run migration script",
        "description": null,
        "owner": "SYS_ADMIN",
        "estimatedMinutes": 45,
        "orderIndex": 2,
        "requiresEvidence": true,
        "status": "BLOCKED",
        "version": 0,
        "startedAt": null,
        "completedAt": null,
        "failedAt": null,
        "dependsOn": ["uuid-of-run-task-1"],
        "blockingTaskIds": ["uuid-of-run-task-1"],
        "evidenceCount": 0,
        "canStart": false,
        "canComplete": false
      }
    ]
  }
}
```

---

## 10. Run Task Transition Endpoints

All transition endpoints must be authenticated.

All transition endpoints must use Prisma transactions.

All successful transitions must write audit entries in the same transaction.

### `POST /runs/:runId/tasks/:taskId/start`

Starts a ready task.

#### POST /runs/:runId/tasks/:taskId/start Request

```json
{
  "clientVersion": 0
}
```

#### POST /runs/:runId/tasks/:taskId/start Server Rules

- Task must exist inside the run.
- Run must be active.
- Task must be `READY`.
- All dependencies must be `COMPLETED`.
- Task becomes `IN_PROGRESS`.
- `startedAt` is set.
- Audit entry `TASK_STARTED` is written.

#### POST /runs/:runId/tasks/:taskId/start Success Response

```http
200 OK
```

```json
{
  "data": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "version": 1,
    "startedAt": "2026-05-25T22:03:00.000Z"
  }
}
```

#### POST /runs/:runId/tasks/:taskId/start Errors

| Status | Code |
| ---: | --- |
| 404 | `NOT_FOUND` |
| 409 | `TASK_BLOCKED` |
| 409 | `INVALID_STATUS_TRANSITION` |
| 409 | `STALE_VERSION` |

---

### `POST /runs/:runId/tasks/:taskId/evidence`

Adds text-only evidence to a run task.

No file upload is allowed.

#### POST /runs/:runId/tasks/:taskId/evidence Request

```json
{
  "content": "Connectivity verified from app server and migration host."
}
```

#### POST /runs/:runId/tasks/:taskId/evidence Validation

| Field | Required | Rules |
| --- | ---: | --- |
| `content` | Yes | string, 1-4000 chars |

#### POST /runs/:runId/tasks/:taskId/evidence Server Rules

- Task must exist inside the run.
- Evidence content must be non-empty text.
- Evidence is saved.
- Audit entry `EVIDENCE_ADDED` is written.

#### POST /runs/:runId/tasks/:taskId/evidence Success Response

```http
201 Created
```

```json
{
  "data": {
    "id": "uuid",
    "runTaskId": "uuid",
    "content": "Connectivity verified from app server and migration host.",
    "createdById": "uuid",
    "createdAt": "2026-05-25T22:05:00.000Z"
  }
}
```

---

### `POST /runs/:runId/tasks/:taskId/complete`

Completes an in-progress task.

#### POST /runs/:runId/tasks/:taskId/complete Request

```json
{
  "clientVersion": 1
}
```

#### POST /runs/:runId/tasks/:taskId/complete Server Rules

- Task must exist inside the run.
- Run must be active.
- Task must be `IN_PROGRESS`.
- If `requiresEvidence` is true, at least one text evidence entry must exist.
- Task becomes `COMPLETED`.
- `completedAt` is set.
- Audit entry `TASK_COMPLETED` is written.
- Downstream task statuses are recalculated.
- Newly unlocked tasks become `READY`.

#### POST /runs/:runId/tasks/:taskId/complete Success Response

```http
200 OK
```

```json
{
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "version": 2,
    "completedAt": "2026-05-25T22:08:00.000Z",
    "unlockedTaskIds": ["uuid"]
  }
}
```

#### POST /runs/:runId/tasks/:taskId/complete Errors

| Status | Code |
| ---: | --- |
| 404 | `NOT_FOUND` |
| 409 | `INVALID_STATUS_TRANSITION` |
| 409 | `STALE_VERSION` |
| 422 | `EVIDENCE_REQUIRED` |

---

### `POST /runs/:runId/tasks/:taskId/fail`

Marks a task as failed.

#### POST /runs/:runId/tasks/:taskId/fail Request

```json
{
  "clientVersion": 1,
  "reason": "Migration script exited with non-zero status."
}
```

#### POST /runs/:runId/tasks/:taskId/fail Validation

| Field | Required | Rules |
| --- | ---: | --- |
| `clientVersion` | Yes | integer >= 0 |
| `reason` | No | string, max 1000 chars |

#### POST /runs/:runId/tasks/:taskId/fail Server Rules

- Task must exist inside the run.
- Run must be active.
- Task must not already be `COMPLETED`.
- Task becomes `FAILED`.
- `failedAt` is set.
- Audit entry `TASK_FAILED` is written.
- Downstream tasks depending on the failed task remain `BLOCKED`.

#### POST /runs/:runId/tasks/:taskId/fail Success Response

```http
200 OK
```

```json
{
  "data": {
    "id": "uuid",
    "status": "FAILED",
    "version": 2,
    "failedAt": "2026-05-25T22:10:00.000Z"
  }
}
```

---

## 11. Audit Endpoints

### `GET /runs/:runId/audit`

Returns the append-only audit ledger for a run.

This endpoint is read-only.

There must be no API endpoint to update or delete audit entries.

#### GET /runs/:runId/audit Optional Query Params

| Param | Required | Description |
| --- | ---: | --- |
| `limit` | No | default `100`, max `500` |
| `cursor` | No | pagination cursor |

#### GET /runs/:runId/audit Success Response

```http
200 OK
```

```json
{
  "data": [
    {
      "id": "uuid",
      "runId": "uuid",
      "runTaskId": "uuid",
      "actorId": "uuid",
      "eventType": "TASK_STARTED",
      "fromStatus": "READY",
      "toStatus": "IN_PROGRESS",
      "message": "Task T-001 started by Admin.",
      "metadata": {
        "externalId": "T-001",
        "version": 1
      },
      "createdAt": "2026-05-25T22:03:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "nextCursor": null
  }
}
```

---

## 12. Health Endpoints

### `GET /health/live`

Liveness check.

#### GET /health/live Success Response

```http
200 OK
```

```json
{
  "data": {
    "status": "ok"
  }
}
```

---

### `GET /health/ready`

Readiness check.

Should verify database connectivity.

#### GET /health/ready Success Response

```http
200 OK
```

```json
{
  "data": {
    "status": "ok",
    "database": "ok"
  }
}
```

---

## 13. Frontend Polling Contract

Angular execution board must poll:

```text
GET /runs/:runId/board
```

Polling interval:

```text
5000ms
```

Frontend behavior:

- Start polling when `ExecutionPage` loads.
- Stop polling when `ExecutionPage` is destroyed.
- Refresh immediately after state-changing actions.
- Keep buttons disabled according to server response fields like `canStart` and `canComplete`.
- Treat backend errors as authoritative.

No WebSockets.

---

## 14. MVP Golden Path API Flow

This is the main flow the API must support.

### 1. Login

```http
POST /auth/login
```

### 2. Import CSV text

```http
POST /templates/import-csv-text
```

### 3. Launch run

```http
POST /runs
```

### 4. Load board

```http
GET /runs/:runId/board
```

Expected:

- First task is `READY` if it has no dependencies.
- Dependent task is `BLOCKED`.

### 5. Start first task

```http
POST /runs/:runId/tasks/:taskId/start
```

Expected:

- Task moves from `READY` to `IN_PROGRESS`.
- Audit entry is written.

### 6. Add text evidence

```http
POST /runs/:runId/tasks/:taskId/evidence
```

Expected:

- Evidence is saved.
- Audit entry is written.

### 7. Complete first task

```http
POST /runs/:runId/tasks/:taskId/complete
```

Expected:

- Task moves from `IN_PROGRESS` to `COMPLETED`.
- Audit entry is written.
- Dependent task becomes `READY`.

### 8. Read audit ledger

```http
GET /runs/:runId/audit
```

Expected:

- Ledger contains `RUN_LAUNCHED`.
- Ledger contains `TASK_STARTED`.
- Ledger contains `EVIDENCE_ADDED`.
- Ledger contains `TASK_COMPLETED`.
- Audit rows are read-only.

---

## 15. Explicitly Excluded Endpoints

Do not implement these during MVP:

```text
POST /auth/signup
POST /organizations
POST /workspaces
POST /teams
POST /invites
POST /roles
POST /permissions
POST /files
POST /uploads
POST /runs/:runId/subscribe
GET /ws
POST /webhooks
POST /notifications/email
POST /notifications/slack
PATCH /audit/:auditEntryId
DELETE /audit/:auditEntryId
```

---

## 16. Contract Finalization Checklist

Before asking AI to generate NestJS services or Angular components, confirm this API contract and the Prisma schema draft are finalized.

- [X] Authentication contract confirmed.
- [X] Template endpoints confirmed.
- [X] CSV text import contract confirmed.
- [X] Run launch contract confirmed.
- [X] Run board contract confirmed.
- [X] Task transition contract confirmed.
- [X] Text evidence contract confirmed.
- [X] Audit contract confirmed.
- [X] Error format confirmed.
- [X] Prisma schema draft aligned with this contract.
