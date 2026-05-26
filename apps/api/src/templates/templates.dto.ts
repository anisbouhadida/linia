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
  CreateTemplateDto,
  CreateTemplateTaskDto,
  UpdateTemplateTaskDto,
} from '@linia/shared';

export class CreateTemplateBody implements CreateTemplateDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTemplateTaskBody implements CreateTemplateTaskDto {
  @IsString()
  @MinLength(1)
  externalId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsBoolean()
  requiresEvidence!: boolean;
}

export class UpdateTemplateTaskBody implements UpdateTemplateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  requiresEvidence?: boolean;
}
