export const RUN_TASK_STATUSES = [
  "BLOCKED",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
] as const;

export type RunTaskStatus = (typeof RUN_TASK_STATUSES)[number];

export const RUN_STATUSES = ["ACTIVE", "COMPLETED", "ABORTED"] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

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

export type IsoDateTimeString = string;
export type EntityId = string;

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface ApiDataResponse<TData> {
  data: TData;
}

export interface ApiListMeta {
  total: number;
  nextCursor?: string | null;
}

export interface ApiListResponse<TData> {
  data: TData[];
  meta: ApiListMeta;
}

export interface UserDto {
  id: EntityId;
  email: string;
  displayName: string;
  createdAt: IsoDateTimeString;
}

export interface AuthSessionDto {
  user: UserDto;
}

export interface TemplateSummaryDto {
  id: EntityId;
  name: string;
  description: string | null;
  taskCount: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

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

export interface TemplateDetailDto {
  id: EntityId;
  name: string;
  description: string | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  tasks: TemplateTaskDto[];
}

export interface TemplateDependencyDto {
  id: EntityId;
  templateId: EntityId;
  taskId: EntityId;
  dependsOnTaskId: EntityId;
}

export interface ImportedTemplateSummaryDto {
  id: EntityId;
  name: string;
  description: string | null;
  taskCount: number;
  dependencyCount: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface ImportTemplateCsvResultDto {
  template: ImportedTemplateSummaryDto;
}

export interface RunDto {
  id: EntityId;
  templateId: EntityId;
  name: string;
  status: RunStatus;
  startedAt: IsoDateTimeString;
  completedAt: IsoDateTimeString | null;
  createdAt?: IsoDateTimeString;
}

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
  blockingTaskIds: EntityId[];
  evidenceCount: number;
  canStart: boolean;
  canComplete: boolean;
}

export interface RunBoardSummaryDto {
  total: number;
  blocked: number;
  ready: number;
  inProgress: number;
  completed: number;
  failed: number;
}

export interface RunBoardDto {
  run: Omit<RunDto, "createdAt">;
  summary: RunBoardSummaryDto;
  tasks: RunTaskDto[];
}

export interface EvidenceDto {
  id: EntityId;
  runTaskId: EntityId;
  content: string;
  createdById: EntityId;
  createdAt: IsoDateTimeString;
}

export interface AuditEntryMetadataDto {
  externalId?: string;
  version?: number;
  [key: string]: unknown;
}

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

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
}

export interface CreateTemplateTaskDto {
  externalId: string;
  title: string;
  description?: string;
  owner?: string;
  estimatedMinutes?: number;
  orderIndex: number;
  requiresEvidence: boolean;
}

export interface UpdateTemplateTaskDto {
  title?: string;
  description?: string;
  owner?: string;
  estimatedMinutes?: number;
  orderIndex?: number;
  requiresEvidence?: boolean;
}

export interface CreateTemplateDependencyDto {
  taskId: EntityId;
  dependsOnTaskId: EntityId;
}

export interface ImportTemplateCsvTextDto {
  templateName: string;
  description?: string;
  csv: string;
}

export interface CreateRunDto {
  templateId: EntityId;
  name: string;
}

export interface RunTaskVersionDto {
  clientVersion: number;
}

export interface AddRunTaskEvidenceDto {
  content: string;
}

export interface FailRunTaskDto extends RunTaskVersionDto {
  reason?: string;
}

export interface RunTaskStatusChangeDto {
  id: EntityId;
  status: RunTaskStatus;
  version: number;
  startedAt?: IsoDateTimeString;
  completedAt?: IsoDateTimeString;
  failedAt?: IsoDateTimeString;
  unlockedTaskIds?: EntityId[];
}

export interface HealthLiveDto {
  status: "ok";
}

export interface HealthReadyDto extends HealthLiveDto {
  database: "ok";
}

export type TaskStatus = RunTaskStatus;
export type AuditAction = AuditEventType;
