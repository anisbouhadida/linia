import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type {
  CreateTemplateDependencyDto,
  CreateTemplateDto,
  CreateTemplateTaskDto,
  ImportTemplateCsvTextDto,
  UpdateTemplateTaskDto,
} from '@linia/shared';

/**
 * Validated request body for creating a template shell.
 */
export class CreateTemplateBody implements CreateTemplateDto {
  /** User-visible template name; service trimming rejects whitespace-only values. */
  @IsString()
  @MinLength(1)
  name!: string;

  /** Optional operator-facing context for the checklist. */
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Validated request body for importing a template from pasted CSV text.
 */
export class ImportTemplateCsvTextBody implements ImportTemplateCsvTextDto {
  /** User-visible template name for the imported checklist. */
  @IsString()
  @MinLength(1)
  templateName!: string;

  /** Optional operator-facing context for the imported checklist. */
  @IsOptional()
  @IsString()
  description?: string;

  /** Raw CSV text sent inside JSON; backend file uploads are intentionally excluded. */
  @IsString()
  @MinLength(1)
  csv!: string;
}

/**
 * Validated request body for appending a manual task to a template.
 */
export class CreateTemplateTaskBody implements CreateTemplateTaskDto {
  /** Stable task identifier supplied by the operator, such as an external runbook id. */
  @IsString()
  @MinLength(1)
  externalId!: string;

  /** Human-readable action title shown in planning and execution views. */
  @IsString()
  @MinLength(1)
  title!: string;

  /** Optional free-form task detail. */
  @IsOptional()
  @IsString()
  description?: string;

  /** Optional responsible person or team label. */
  @IsOptional()
  @IsString()
  owner?: string;

  /** Optional estimate in whole minutes; negative or fractional values are rejected. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  /** Whether completion will later require text evidence on a launched run task. */
  @IsBoolean()
  requiresEvidence!: boolean;
}

/**
 * Validated partial request body for editing an existing template task.
 */
export class UpdateTemplateTaskBody implements UpdateTemplateTaskDto {
  /** Replacement title; omitted fields are left unchanged. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  /** Replacement description, where an empty string is normalized to null by the service. */
  @IsOptional()
  @IsString()
  description?: string;

  /** Replacement owner label, where an empty string is normalized to null by the service. */
  @IsOptional()
  @IsString()
  owner?: string;

  /** Replacement whole-minute estimate. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  /** New zero-based ordering position within the template. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number;

  /** Replacement evidence requirement for future runs launched from this template. */
  @IsOptional()
  @IsBoolean()
  requiresEvidence?: boolean;
}

/**
 * Validated request body for creating a dependency between two template tasks.
 */
export class CreateTemplateDependencyBody implements CreateTemplateDependencyDto {
  /** Dependent task that will be blocked until its predecessor completes. */
  @IsString()
  @MinLength(1)
  taskId!: string;

  /** Predecessor task that must complete first in launched runs. */
  @IsString()
  @MinLength(1)
  dependsOnTaskId!: string;
}
