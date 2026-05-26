import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  const createdAt = new Date('2026-05-26T10:00:00.000Z');
  const updatedAt = new Date('2026-05-26T10:30:00.000Z');

  it('creates a template and returns a summary', async () => {
    const prisma = {
      template: {
        create: jest.fn().mockResolvedValue({
          id: 'template-1',
          name: 'Core Migration',
          description: 'Launch checklist',
          createdAt,
          updatedAt,
          _count: { tasks: 0 },
        }),
      },
    };
    const service = new TemplatesService(prisma);

    await expect(
      service.createTemplate({
        name: ' Core Migration ',
        description: ' Launch checklist ',
      }),
    ).resolves.toEqual({
      id: 'template-1',
      name: 'Core Migration',
      description: 'Launch checklist',
      taskCount: 0,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });

    expect(prisma.template.create).toHaveBeenCalledWith({
      data: {
        name: 'Core Migration',
        description: 'Launch checklist',
      },
      include: { _count: { select: { tasks: true } } },
    });
  });

  it('lists templates with task counts', async () => {
    const prisma = {
      template: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'template-1',
            name: 'Core Migration',
            description: null,
            createdAt,
            updatedAt,
            _count: { tasks: 2 },
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = new TemplatesService(prisma);

    await expect(service.listTemplates()).resolves.toEqual({
      data: [
        {
          id: 'template-1',
          name: 'Core Migration',
          description: null,
          taskCount: 2,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
      meta: { total: 1, nextCursor: null },
    });
  });

  it('rejects templates without a name', async () => {
    const service = new TemplatesService({ template: { create: jest.fn() } });

    await expect(
      service.createTemplate({ name: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a template task using the next order index', async () => {
    const prisma = {
      template: {
        findUnique: jest.fn().mockResolvedValue({ id: 'template-1' }),
      },
      templateTask: {
        aggregate: jest.fn().mockResolvedValue({ _max: { orderIndex: 1 } }),
        create: jest.fn().mockResolvedValue({
          id: 'task-1',
          templateId: 'template-1',
          externalId: 'T-001',
          title: 'Check database',
          description: null,
          owner: 'DBA',
          estimatedMinutes: 15,
          orderIndex: 2,
          requiresEvidence: true,
          dependencies: [],
        }),
      },
    };
    const service = new TemplatesService(prisma);

    await expect(
      service.createTask('template-1', {
        externalId: ' T-001 ',
        title: ' Check database ',
        owner: ' DBA ',
        estimatedMinutes: 15,
        orderIndex: 999,
        requiresEvidence: true,
      }),
    ).resolves.toEqual({
      id: 'task-1',
      templateId: 'template-1',
      externalId: 'T-001',
      title: 'Check database',
      description: null,
      owner: 'DBA',
      estimatedMinutes: 15,
      orderIndex: 2,
      requiresEvidence: true,
      dependsOn: [],
    });

    expect(prisma.templateTask.create).toHaveBeenCalledWith({
      data: {
        templateId: 'template-1',
        externalId: 'T-001',
        title: 'Check database',
        description: null,
        owner: 'DBA',
        estimatedMinutes: 15,
        orderIndex: 2,
        requiresEvidence: true,
      },
      include: { dependencies: true },
    });
  });

  it('rejects tasks without a title', async () => {
    const prisma = {
      template: {
        findUnique: jest.fn().mockResolvedValue({ id: 'template-1' }),
      },
      templateTask: { aggregate: jest.fn(), create: jest.fn() },
    };
    const service = new TemplatesService(prisma);

    await expect(
      service.createTask('template-1', {
        externalId: 'T-001',
        title: '',
        orderIndex: 0,
        requiresEvidence: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails when adding a task to a missing template', async () => {
    const prisma = {
      template: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      templateTask: { aggregate: jest.fn(), create: jest.fn() },
    };
    const service = new TemplatesService(prisma);

    await expect(
      service.createTask('missing-template', {
        externalId: 'T-001',
        title: 'Check database',
        orderIndex: 0,
        requiresEvidence: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
