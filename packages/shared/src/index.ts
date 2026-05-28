/**
 * Ordered lifecycle states for a task within a run board.
 *
 * `BLOCKED` tasks cannot start until all predecessors complete, and `FAILED`
 * tasks intentionally do not unlock downstream work.
 */
export const RUN_TASK_STATUSES = [
  "BLOCKED",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
] as const;

export type RunTaskStatus = (typeof RUN_TASK_STATUSES)[number];

/** Lifecycle states for a launched run. */
export const RUN_STATUSES = ["ACTIVE", "COMPLETED", "ABORTED"] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

/**
 * Audit event identifiers emitted by run and task workflows.
 *
 * These values are persisted in the append-only audit ledger, so changes here
 * must stay compatible with existing database rows and API clients.
 */
export const AUDIT_EVENT_TYPES = [
  "RUN_LAUNCHED",
  "TASK_READY",
  "TASK_STARTED",
  "TASK_COMPLETED",
  "TASK_FAILED",
  "EVIDENCE_ADDED",
  "RUN_COMPLETED",
  "RUN_ABORTED",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/**
 * Stable machine-readable error codes returned by the API error envelope.
 *
 * UI code should branch on these values rather than parsing human messages.
 */
export const API_ERROR_CODES = [
  "BAD_REQUEST",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "VALIDATION_ERROR",
  "INTERNAL_ERROR",
  "TASK_BLOCKED",
  "INVALID_STATUS_TRANSITION",
  "STALE_VERSION",
  "EVIDENCE_REQUIRED",
  "INVALID_DEPENDENCY",
  "DUPLICATE_EXTERNAL_ID",
  "UNKNOWN_DEPENDENCY_REFERENCE",
  "EMPTY_CSV",
  "INVALID_CSV_HEADER",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** ISO 8601 date-time value serialized as a JSON string. */
export type IsoDateTimeString = string;

/** Opaque database-backed identifier exposed through API DTOs. */
export type EntityId = string;

/**
 * Field-level or request-level validation detail attached to an API error.
 */
export interface ApiErrorDetail {
  /** Dot-path field name when the error belongs to a specific request property. */
  field?: string;
  /** Human-readable validation or business-rule message. */
  message: string;
}

/** Normalized API error payload shared by all non-success responses. */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details: ApiErrorDetail[];
}

/** Response envelope used when an endpoint fails. */
export interface ApiErrorResponse {
  error: ApiError;
}

/** Response envelope used by endpoints that return a single resource. */
export interface ApiDataResponse<TData> {
  data: TData;
}

/**
 * Pagination metadata for list endpoints.
 *
 * `nextCursor` is reserved for future cursor pagination; current MVP endpoints
 * may return `null` while still exposing total counts.
 */
export interface ApiListMeta {
  total: number;
  nextCursor?: string | null;
}

/** Response envelope used by endpoints that return a list of resources. */
export interface ApiListResponse<TData> {
  data: TData[];
  meta: ApiListMeta;
}

/** Public user shape returned to clients without credential material. */
export interface UserDto {
  id: EntityId;
  email: string;
  displayName: string;
  createdAt: IsoDateTimeString;
}

/** Authenticated session payload returned by session endpoints. */
export interface AuthSessionDto {
  user: UserDto;
}

/** Compact template representation for list views. */
export interface TemplateSummaryDto {
  id: EntityId;
  name: string;
  description: string | null;
  taskCount: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

/**
 * Task definition as stored on a template before a run is launched.
 *
 * Template tasks remain editable; launched runs snapshot these fields into
 * run-specific task records so historical execution data stays stable.
 */
export interface TemplateTaskDto {
  id: EntityId;
  templateId: EntityId;
  externalId: string;
  title: string;
  description: string | null;
  owner: string | null;
  estimatedMinutes: number | null;
  orderIndex: number;
  requiresEvidence: boolean;
  dependsOn: EntityId[];
}

/** Full template representation including ordered task definitions. */
export interface TemplateDetailDto {
  id: EntityId;
  name: string;
  description: string | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  tasks: TemplateTaskDto[];
}

/** Directed dependency edge between two tasks in the same template. */
export interface TemplateDependencyDto {
  id: EntityId;
  templateId: EntityId;
  taskId: EntityId;
  dependsOnTaskId: EntityId;
}

/** Template import result summary including dependency count. */
export interface ImportedTemplateSummaryDto {
  id: EntityId;
  name: string;
  description: string | null;
  taskCount: number;
  dependencyCount: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

/** Response body returned after importing a template from CSV text. */
export interface ImportTemplateCsvResultDto {
  template: ImportedTemplateSummaryDto;
}

/** Run details for a launched template instance. */
export interface RunDto {
  id: EntityId;
  templateId: EntityId;
  name: string;
  status: RunStatus;
  startedAt: IsoDateTimeString;
  completedAt: IsoDateTimeString | null;
  createdAt?: IsoDateTimeString;
}

/** Compact run representation with aggregate task progress. */
export interface RunSummaryDto {
  id: EntityId;
  templateId: EntityId;
  name: string;
  status: RunStatus;
  taskCount: number;
  completedTaskCount: number;
  startedAt: IsoDateTimeString;
  completedAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
}

/**
 * Runtime task state including dependency and optimistic-locking metadata.
 *
 * `version` must be supplied back by clients when mutating a task so the API can
 * reject stale actions during live run execution.
 */
export interface RunTaskDto {
  id: EntityId;
  runId: EntityId;
  templateTaskId: EntityId;
  externalId: string;
  title: string;
  description: string | null;
  owner: string | null;
  estimatedMinutes: number | null;
  orderIndex: number;
  requiresEvidence: boolean;
  status: RunTaskStatus;
  version: number;
  startedAt: IsoDateTimeString | null;
  completedAt: IsoDateTimeString | null;
  failedAt: IsoDateTimeString | null;
  dependsOn: EntityId[];
  /** Dependency ids that currently prevent this task from starting. */
  blockingTaskIds: EntityId[];
  /** Number of text evidence entries already attached to this run task. */
  evidenceCount: number;
  /** Server-authoritative flag used by the UI to enable start actions. */
  canStart: boolean;
  /** Server-authoritative flag used by the UI to enable completion actions. */
  canComplete: boolean;
}

/** Count of run tasks grouped by current status. */
export interface RunBoardSummaryDto {
  total: number;
  blocked: number;
  ready: number;
  inProgress: number;
  completed: number;
  failed: number;
}

/** Run board payload used to render a run and its task columns. */
export interface RunBoardDto {
  run: Omit<RunDto, "createdAt">;
  summary: RunBoardSummaryDto;
  tasks: RunTaskDto[];
}

/** Evidence entry attached to a task that requires completion proof. */
export interface EvidenceDto {
  id: EntityId;
  runTaskId: EntityId;
  content: string;
  createdById: EntityId;
  createdAt: IsoDateTimeString;
}

/**
 * Flexible event metadata stored alongside an audit entry.
 *
 * Keep values JSON-serializable because metadata is persisted and returned
 * through the API without a richer schema.
 */
export interface AuditEntryMetadataDto {
  externalId?: string;
  version?: number;
  [key: string]: unknown;
}

/**
 * Immutable audit log entry for a run or task workflow event.
 *
 * Application code must append entries only; update/delete flows are outside
 * the MVP contract.
 */
export interface AuditEntryDto {
  id: EntityId;
  runId: EntityId;
  runTaskId: EntityId | null;
  actorId: EntityId;
  eventType: AuditEventType;
  fromStatus: RunTaskStatus | null;
  toStatus: RunTaskStatus | null;
  message: string;
  metadata: AuditEntryMetadataDto;
  createdAt: IsoDateTimeString;
}

/** Credentials accepted by the login endpoint. */
export interface LoginDto {
  email: string;
  password: string;
}

/** Payload for creating a template shell. */
export interface CreateTemplateDto {
  name: string;
  description?: string;
}

/** Payload for creating a task definition within a template. */
export interface CreateTemplateTaskDto {
  externalId: string;
  title: string;
  description?: string;
  owner?: string;
  estimatedMinutes?: number;
  requiresEvidence: boolean;
}

/** Partial payload for editing a template task definition. */
export interface UpdateTemplateTaskDto {
  title?: string;
  description?: string;
  owner?: string;
  estimatedMinutes?: number;
  orderIndex?: number;
  requiresEvidence?: boolean;
}

/** Payload for adding a directed dependency between template tasks. */
export interface CreateTemplateDependencyDto {
  taskId: EntityId;
  dependsOnTaskId: EntityId;
}

/**
 * Raw CSV import request used to create a template and its tasks.
 *
 * The backend accepts CSV text inside JSON; it must not introduce file-upload
 * infrastructure for the MVP.
 */
export interface ImportTemplateCsvTextDto {
  templateName: string;
  description?: string;
  csv: string;
}

/** Payload for launching a new run from an existing template. */
export interface CreateRunDto {
  templateId: EntityId;
  name: string;
}

/**
 * Optimistic-lock token required when mutating a run task.
 *
 * The API compares this with the current task version and returns `STALE_VERSION`
 * when another operator or request has already changed the task.
 */
export interface RunTaskVersionDto {
  clientVersion: number;
}

/** Payload for adding free-form evidence to a run task. */
export interface AddRunTaskEvidenceDto {
  content: string;
}

/** Payload for failing a run task at a known version. */
export interface FailRunTaskDto extends RunTaskVersionDto {
  reason?: string;
}

/** Result of a task status transition, including unlocked downstream tasks. */
export interface RunTaskStatusChangeDto {
  id: EntityId;
  status: RunTaskStatus;
  version: number;
  startedAt?: IsoDateTimeString;
  completedAt?: IsoDateTimeString;
  failedAt?: IsoDateTimeString;
  unlockedTaskIds?: EntityId[];
}

/** Liveness probe response. */
export interface HealthLiveDto {
  status: "ok";
}

/** Readiness probe response including dependency checks. */
export interface HealthReadyDto extends HealthLiveDto {
  database: "ok";
}

/** Backward-compatible alias for run task status values. */
export type TaskStatus = RunTaskStatus;

/** Backward-compatible alias for audit event identifiers. */
export type AuditAction = AuditEventType;
