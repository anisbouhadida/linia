import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ApiListResponse,
  CreateTemplateDto,
  CreateTemplateTaskDto,
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
  UpdateTemplateTaskDto,
} from '@linia/shared';
import { PrismaService } from '../database/prisma.service';

type TemplateWithTaskCount = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { tasks: number };
};

type TemplateTaskWithDependencies = {
  id: string;
  templateId: string;
  externalId: string;
  title: string;
  description: string | null;
  owner: string | null;
  estimatedMinutes: number | null;
  orderIndex: number;
  requiresEvidence: boolean;
  dependencies: { dependsOnTaskId: string }[];
};

type TemplateDetailRecord = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  tasks: TemplateTaskWithDependencies[];
};

/**
 * Coordinates template persistence and task normalization for the planning API.
 *
 * This service is the server-side authority for trimming text fields, assigning
 * task order, ensuring template ownership of task mutations, and translating
 * Prisma records into shared DTOs.
 */
@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reads all templates with task counts for the planning sidebar.
   *
   * @returns A list envelope containing template summaries and total count.
   */
  async listTemplates(): Promise<ApiListResponse<TemplateSummaryDto>> {
    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { tasks: true } } },
      }),
      this.prisma.template.count(),
    ]);

    return {
      data: templates.map(toTemplateSummary),
      meta: { total, nextCursor: null },
    };
  }

  /**
   * Creates a template after normalizing required and optional text.
   *
   * @param input - Template creation payload from the controller.
   * @returns The persisted template summary with an initial task count.
   * @throws BadRequestException when the name is blank after trimming.
   */
  async createTemplate(
    input: CreateTemplateDto,
  ): Promise<TemplateSummaryDto> {
    const name = requiredText(input.name, 'name');
    const description = optionalText(input.description);

    const template = await this.prisma.template.create({
      data: { name, description },
      include: { _count: { select: { tasks: true } } },
    });

    return toTemplateSummary(template);
  }

  /**
   * Loads a template detail record with tasks ordered by `orderIndex`.
   *
   * @param id - Template id from the route parameter.
   * @returns The template detail DTO, including ordered tasks.
   * @throws NotFoundException when the template id does not exist.
   */
  async getTemplate(id: string): Promise<TemplateDetailDto> {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' },
          include: { dependencies: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return toTemplateDetail(template);
  }

  /**
   * Appends a new task to a template and assigns the next order index.
   *
   * @param templateId - Parent template id from the route parameter.
   * @param input - Task creation payload from the request body.
   * @returns The created task DTO with dependency ids.
   * @throws NotFoundException when the template id does not exist.
   * @throws BadRequestException when required text or estimated minutes are invalid.
   * @throws ConflictException when the task violates a database uniqueness rule.
   */
  async createTask(
    templateId: string,
    input: CreateTemplateTaskDto,
  ): Promise<TemplateTaskDto> {
    await this.ensureTemplateExists(templateId);
    const externalId = requiredText(input.externalId, 'externalId');
    const title = requiredText(input.title, 'title');
    const description = optionalText(input.description);
    const owner = optionalText(input.owner);
    const estimatedMinutes = optionalNumber(input.estimatedMinutes);

    const maxOrder = await this.prisma.templateTask.aggregate({
      where: { templateId },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    try {
      const task = await this.prisma.templateTask.create({
        data: {
          templateId,
          externalId,
          title,
          description,
          owner,
          estimatedMinutes,
          orderIndex,
          requiresEvidence: input.requiresEvidence,
        },
        include: { dependencies: true },
      });

      return toTemplateTask(task);
    } catch (error) {
      throwConflictForUniqueViolation(error);
      throw error;
    }
  }

  /**
   * Applies a partial update to a task that belongs to the given template.
   *
   * @param templateId - Parent template id used to scope the task lookup.
   * @param taskId - Task id from the nested route parameter.
   * @param input - Partial task update payload.
   * @returns The updated task DTO with dependency ids.
   * @throws NotFoundException when the template or task cannot be found.
   * @throws BadRequestException when supplied field values are invalid.
   * @throws ConflictException when the update violates a database uniqueness rule.
   */
  async updateTask(
    templateId: string,
    taskId: string,
    input: UpdateTemplateTaskDto,
  ): Promise<TemplateTaskDto> {
    await this.ensureTemplateExists(templateId);
    const existing = await this.prisma.templateTask.findFirst({
      where: { id: taskId, templateId },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    try {
      const task = await this.prisma.templateTask.update({
        where: { id: taskId },
        data: {
          title:
            input.title === undefined
              ? undefined
              : requiredText(input.title, 'title'),
          description:
            input.description === undefined
              ? undefined
              : optionalText(input.description),
          owner: input.owner === undefined ? undefined : optionalText(input.owner),
          estimatedMinutes:
            input.estimatedMinutes === undefined
              ? undefined
              : optionalNumber(input.estimatedMinutes),
          orderIndex: input.orderIndex,
          requiresEvidence: input.requiresEvidence,
        },
        include: { dependencies: true },
      });

      return toTemplateTask(task);
    } catch (error) {
      throwConflictForUniqueViolation(error);
      throw error;
    }
  }

  /**
   * Verifies a template exists before creating or mutating nested task records.
   *
   * @param templateId - Template id to look up.
   * @returns Resolves when the template exists.
   * @throws NotFoundException when the template id does not exist.
   */
  private async ensureTemplateExists(templateId: string): Promise<void> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      select: { id: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }
  }
}

/**
 * Maps Prisma template summaries into the shared API contract.
 *
 * @param template - Prisma template record including task count.
 * @returns Shared template summary DTO.
 */
function toTemplateSummary(template: TemplateWithTaskCount): TemplateSummaryDto {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    taskCount: template._count.tasks,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

/**
 * Maps a Prisma template detail record into a contract-safe DTO.
 *
 * @param template - Prisma template detail record including tasks and dependencies.
 * @returns Shared template detail DTO.
 */
function toTemplateDetail(template: TemplateDetailRecord): TemplateDetailDto {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    tasks: template.tasks.map(toTemplateTask),
  };
}

/**
 * Converts task dependencies from relation records into a flat id list for clients.
 *
 * @param task - Prisma task record including dependency relation rows.
 * @returns Shared template task DTO.
 */
function toTemplateTask(task: TemplateTaskWithDependencies): TemplateTaskDto {
  return {
    id: task.id,
    templateId: task.templateId,
    externalId: task.externalId,
    title: task.title,
    description: task.description,
    owner: task.owner,
    estimatedMinutes: task.estimatedMinutes,
    orderIndex: task.orderIndex,
    requiresEvidence: task.requiresEvidence,
    dependsOn: task.dependencies.map((dependency) => dependency.dependsOnTaskId),
  };
}

/**
 * Trims required text fields and rejects empty values consistently.
 *
 * @param value - User-provided string to normalize.
 * @param field - Field name used in the validation error message.
 * @returns The trimmed non-empty string.
 * @throws BadRequestException when the trimmed value is empty.
 */
function requiredText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException(`${field} is required`);
  }

  return trimmed;
}

/**
 * Normalizes omitted or whitespace-only text fields to null for database storage.
 *
 * @param value - Optional user-provided string.
 * @returns Trimmed text, or null when omitted or blank.
 */
function optionalText(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

/**
 * Normalizes optional minute estimates while rejecting negative or fractional values.
 *
 * @param value - Optional estimate in minutes.
 * @returns A valid whole-minute estimate, or null when omitted.
 * @throws BadRequestException when the value is negative or fractional.
 */
function optionalNumber(value: number | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestException('estimatedMinutes must be a positive integer');
  }

  return value;
}

/**
 * Re-throws Prisma unique constraint failures as API-level conflicts.
 *
 * @param error - Unknown persistence error caught from Prisma.
 * @returns Nothing when the error is not a Prisma unique violation.
 * @throws ConflictException when Prisma reports a unique constraint violation.
 */
function throwConflictForUniqueViolation(error: unknown): void {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('Template task already exists');
  }
}
