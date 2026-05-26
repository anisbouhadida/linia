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

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

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

function requiredText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException(`${field} is required`);
  }

  return trimmed;
}

function optionalText(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function optionalNumber(value: number | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestException('estimatedMinutes must be a positive integer');
  }

  return value;
}

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
