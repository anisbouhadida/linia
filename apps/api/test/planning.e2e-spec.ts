import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureSessionAuth } from './../src/auth/session-auth';
import { PrismaService } from './../src/database/prisma.service';

type FindUniqueArgs = {
  where: {
    email?: string;
    id?: string;
  };
  select?: {
    id?: boolean;
  };
};

type TemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TemplateTaskRecord = {
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

describe('Planning workflow (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('./../src/app.module').AppModule;

  const admin = {
    id: 'user-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    createdAt: new Date('2026-05-25T10:00:00.000Z'),
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_INITIAL_PASSWORD = 'change-me';
    ({ AppModule } =
      require('./../src/app.module') as typeof import('./../src/app.module'));
  });

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('change-me', 4);
    const templates: TemplateRecord[] = [];
    const tasks: TemplateTaskRecord[] = [];

    const prisma = {
      user: {
        findUnique: jest.fn(({ where }: FindUniqueArgs) => {
          if (where.email === admin.email) {
            return Promise.resolve({
              ...admin,
              passwordHash,
            });
          }

          if (where.id === admin.id) {
            return Promise.resolve(admin);
          }

          return Promise.resolve(null);
        }),
      },
      template: {
        findMany: jest.fn(() =>
          Promise.resolve(
            [...templates]
              .sort(
                (left, right) =>
                  right.updatedAt.getTime() - left.updatedAt.getTime(),
              )
              .map((template) => ({
                ...template,
                _count: {
                  tasks: tasks.filter((task) => task.templateId === template.id)
                    .length,
                },
              })),
          ),
        ),
        count: jest.fn(() => Promise.resolve(templates.length)),
        create: jest.fn(({ data }) => {
          const template = {
            id: `template-${templates.length + 1}`,
            name: data.name,
            description: data.description,
            createdAt: new Date('2026-05-25T11:00:00.000Z'),
            updatedAt: new Date('2026-05-25T11:00:00.000Z'),
          };
          templates.push(template);

          return Promise.resolve({
            ...template,
            _count: { tasks: 0 },
          });
        }),
        findUnique: jest.fn(({ where, select }: FindUniqueArgs) => {
          const template = templates.find((item) => item.id === where.id);
          if (!template) {
            return Promise.resolve(null);
          }

          if (select?.id) {
            return Promise.resolve({ id: template.id });
          }

          return Promise.resolve({
            ...template,
            tasks: tasks
              .filter((task) => task.templateId === template.id)
              .sort((left, right) => left.orderIndex - right.orderIndex),
          });
        }),
      },
      templateTask: {
        aggregate: jest.fn(({ where }) => {
          const orderIndexes = tasks
            .filter((task) => task.templateId === where.templateId)
            .map((task) => task.orderIndex);

          return Promise.resolve({
            _max: {
              orderIndex: orderIndexes.length
                ? Math.max(...orderIndexes)
                : null,
            },
          });
        }),
        create: jest.fn(({ data }) => {
          const task = {
            id: `task-${tasks.length + 1}`,
            templateId: data.templateId,
            externalId: data.externalId,
            title: data.title,
            description: data.description,
            owner: data.owner,
            estimatedMinutes: data.estimatedMinutes,
            orderIndex: data.orderIndex,
            requiresEvidence: data.requiresEvidence,
            dependencies: [],
          };
          tasks.push(task);

          return Promise.resolve(task);
        }),
        findFirst: jest.fn(({ where }) =>
          Promise.resolve(
            tasks.find(
              (task) =>
                task.id === where.id && task.templateId === where.templateId,
            ) ?? null,
          ),
        ),
        update: jest.fn(({ where, data }) => {
          const task = tasks.find((item) => item.id === where.id);
          if (!task) {
            throw new Error('Task not found');
          }

          Object.assign(
            task,
            Object.fromEntries(
              Object.entries(data).filter(([, value]) => value !== undefined),
            ),
          );

          return Promise.resolve(task);
        }),
      },
      $queryRaw: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureSessionAuth(app, {
      getOrThrow: (key: string) => {
        if (key === 'SESSION_SECRET') {
          return 'test-session-secret';
        }
        throw new Error(`Unexpected config key: ${key}`);
      },
    } as ConfigService);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('requires a session, then creates and updates a planning template task', async () => {
    const agent = request.agent(app.getHttpAdapter().getInstance());

    await agent.get('/templates').expect(401);

    await agent
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'change-me' })
      .expect(201);

    await agent
      .get('/templates')
      .expect(200)
      .expect({
        data: [],
        meta: { total: 0, nextCursor: null },
      });

    const createTemplateResponse = await agent
      .post('/templates')
      .send({
        name: 'Database Migration Cutover',
        description: 'Core production migration checklist',
      })
      .expect(201);

    const template = createTemplateResponse.body.data;
    expect(template).toMatchObject({
      id: 'template-1',
      name: 'Database Migration Cutover',
      description: 'Core production migration checklist',
      taskCount: 0,
      createdAt: '2026-05-25T11:00:00.000Z',
      updatedAt: '2026-05-25T11:00:00.000Z',
    });

    const createTaskResponse = await agent
      .post(`/templates/${template.id}/tasks`)
      .send({
        externalId: 'T-001',
        title: 'Check database connectivity',
        description:
          'Confirm primary and replica connectivity before migration.',
        owner: 'DBA',
        estimatedMinutes: 15,
        orderIndex: 7,
        requiresEvidence: true,
      })
      .expect(201);

    expect(createTaskResponse.body.data).toEqual({
      id: 'task-1',
      templateId: template.id,
      externalId: 'T-001',
      title: 'Check database connectivity',
      description: 'Confirm primary and replica connectivity before migration.',
      owner: 'DBA',
      estimatedMinutes: 15,
      orderIndex: 0,
      requiresEvidence: true,
      dependsOn: [],
    });

    await agent
      .patch(`/templates/${template.id}/tasks/task-1`)
      .send({ owner: 'Platform', estimatedMinutes: 20 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toMatchObject({
          id: 'task-1',
          owner: 'Platform',
          estimatedMinutes: 20,
        });
      });

    await agent
      .get(`/templates/${template.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.tasks).toEqual([
          expect.objectContaining({
            id: 'task-1',
            externalId: 'T-001',
            owner: 'Platform',
            estimatedMinutes: 20,
            orderIndex: 0,
          }),
        ]);
      });
  });
});
