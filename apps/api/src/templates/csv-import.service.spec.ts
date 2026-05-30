import { UnprocessableEntityException } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';

describe('CsvImportService', () => {
  const createdAt = new Date('2026-05-26T10:00:00.000Z');
  const updatedAt = new Date('2026-05-26T10:30:00.000Z');

  it('imports a template, tasks, and dependency edges from CSV text', async () => {
    const templateCreate = jest.fn().mockResolvedValue({
      id: 'template-1',
      name: 'Core Migration',
      description: 'Imported plan',
      createdAt,
      updatedAt,
    });
    const taskCreateManyAndReturn = jest.fn().mockResolvedValue([
      { id: 'task-1', externalId: 'T-001' },
      { id: 'task-2', externalId: 'T-002' },
    ]);
    const dependencyCreateMany = jest.fn().mockResolvedValue({ count: 1 });
    const transaction = jest.fn(async (callback) =>
      callback({
        template: { create: templateCreate },
        templateTask: { createManyAndReturn: taskCreateManyAndReturn },
        templateDependency: { createMany: dependencyCreateMany },
      }),
    );
    const prisma = { $transaction: transaction };
    const service = new CsvImportService(prisma);

    await expect(
      service.importCsvText({
        templateName: ' Core Migration ',
        description: ' Imported plan ',
        csv: [
          'externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn',
          'T-001,Check DB,,DBA,15,true,',
          'T-002,Run migration,,SYS_ADMIN,45,false,T-001',
        ].join('\n'),
      }),
    ).resolves.toEqual({
      template: {
        id: 'template-1',
        name: 'Core Migration',
        description: 'Imported plan',
        taskCount: 2,
        dependencyCount: 1,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    });

    expect(templateCreate).toHaveBeenCalledWith({
      data: { name: 'Core Migration', description: 'Imported plan' },
    });
    expect(taskCreateManyAndReturn).toHaveBeenCalledWith({
      data: [
        {
          templateId: 'template-1',
          externalId: 'T-001',
          title: 'Check DB',
          description: null,
          owner: 'DBA',
          estimatedMinutes: 15,
          requiresEvidence: true,
          orderIndex: 0,
        },
        {
          templateId: 'template-1',
          externalId: 'T-002',
          title: 'Run migration',
          description: null,
          owner: 'SYS_ADMIN',
          estimatedMinutes: 45,
          requiresEvidence: false,
          orderIndex: 1,
        },
      ],
      select: { id: true, externalId: true },
    });
    expect(dependencyCreateMany).toHaveBeenCalledWith({
      data: [
        {
          templateId: 'template-1',
          taskId: 'task-2',
          dependsOnTaskId: 'task-1',
        },
      ],
    });
  });

  it('rejects duplicate external IDs', async () => {
    const service = new CsvImportService({ $transaction: jest.fn() });

    await expect(
      service.importCsvText({
        templateName: 'Core Migration',
        csv: [
          'externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn',
          'T-001,Check DB,,DBA,15,true,',
          'T-001,Run migration,,SYS_ADMIN,45,false,',
        ].join('\n'),
      }),
    ).rejects.toMatchObject<Partial<UnprocessableEntityException>>({
      name: 'UnprocessableEntityException',
    });
  });

  it('rejects unknown dependency references', async () => {
    const service = new CsvImportService({ $transaction: jest.fn() });

    await expect(
      service.importCsvText({
        templateName: 'Core Migration',
        csv: [
          'externalId,title,description,owner,estimatedMinutes,requiresEvidence,dependsOn',
          'T-001,Check DB,,DBA,15,true,T-404',
        ].join('\n'),
      }),
    ).rejects.toMatchObject<Partial<UnprocessableEntityException>>({
      name: 'UnprocessableEntityException',
    });
  });
});
