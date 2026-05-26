import {
  ConflictException,
  Controller,
  Get,
  HttpException,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SessionAuthGuard } from './../src/auth/session-auth.guard';
import { PrismaService } from './../src/database/prisma.service';

@Controller('test-errors')
class TestErrorsController {
  @Get('business')
  businessError(): never {
    throw new HttpException(
      {
        code: 'EVIDENCE_REQUIRED',
        message: 'Evidence is required before completing this task',
        details: [
          {
            field: 'evidenceText',
            message: 'Evidence text is required',
          },
        ],
      },
      422,
    );
  }

  @Get('conflict')
  conflictError(): never {
    throw new ConflictException('Template task already exists');
  }
}

describe('API error envelopes (e2e)', () => {
  let app: INestApplication<App>;

  const prisma = {
    template: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    templateTask: {
      aggregate: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    prisma.template.create.mockResolvedValue({
      id: 'template-1',
      name: 'Cutover',
      description: null,
      createdAt: new Date('2026-05-25T10:00:00.000Z'),
      updatedAt: new Date('2026-05-25T10:00:00.000Z'),
      _count: { tasks: 0 },
    });
    prisma.template.findUnique.mockResolvedValue(null);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestErrorsController],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects non-whitelisted request fields with a validation error envelope', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    const authenticatedApp = moduleFixture.createNestApplication();
    await authenticatedApp.init();

    try {
      await request(authenticatedApp.getHttpServer() as App)
        .post('/templates')
        .send({ name: 'Cutover', unexpected: 'field' })
        .expect(422)
        .expect(({ body }) => {
          expect(body).toMatchObject({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
            },
          });
          expect(body.error.details).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: 'unexpected',
                message: expect.stringContaining('should not exist'),
              }),
            ]),
          );
        });
    } finally {
      await authenticatedApp.close();
    }
  });

  it('maps unauthenticated requests to the documented error envelope', async () => {
    await request(app.getHttpServer())
      .get('/templates')
      .expect(401)
      .expect(({ body }) => {
        expect(body).toEqual({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Unauthorized',
            details: [],
          },
        });
      });
  });

  it('maps not found exceptions to the documented error envelope', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    const authenticatedApp = moduleFixture.createNestApplication();
    await authenticatedApp.init();

    try {
      await request(authenticatedApp.getHttpServer() as App)
        .get('/templates/missing-template')
        .expect(404)
        .expect(({ body }) => {
          expect(body).toEqual({
            error: {
              code: 'NOT_FOUND',
              message: 'Template not found',
              details: [],
            },
          });
        });
    } finally {
      await authenticatedApp.close();
    }
  });

  it('maps conflict exceptions to the documented error envelope', async () => {
    await request(app.getHttpServer())
      .get('/test-errors/conflict')
      .expect(409)
      .expect(({ body }) => {
        expect(body).toEqual({
          error: {
            code: 'CONFLICT',
            message: 'Template task already exists',
            details: [],
          },
        });
      });
  });

  it('preserves business error codes in the documented error envelope', async () => {
    await request(app.getHttpServer())
      .get('/test-errors/business')
      .expect(422)
      .expect(({ body }) => {
        expect(body).toEqual({
          error: {
            code: 'EVIDENCE_REQUIRED',
            message: 'Evidence is required before completing this task',
            details: [
              {
                field: 'evidenceText',
                message: 'Evidence text is required',
              },
            ],
          },
        });
      });
  });
});
