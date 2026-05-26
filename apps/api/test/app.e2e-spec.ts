import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from './../src/database/prisma.service';

describe('Health endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('./../src/app.module').AppModule;
  let prisma: { $queryRaw: jest.Mock };

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_INITIAL_PASSWORD = 'change-me';
    ({ AppModule } =
      require('./../src/app.module') as typeof import('./../src/app.module'));
  });

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('reports liveness without checking dependencies', async () => {
    await request(app.getHttpAdapter().getInstance())
      .get('/health/live')
      .expect(200)
      .expect({ data: { status: 'ok' } });

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness after checking database connectivity', async () => {
    await request(app.getHttpAdapter().getInstance())
      .get('/health/ready')
      .expect(200)
      .expect({ data: { status: 'ok', database: 'ok' } });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('does not expose the scaffold hello world endpoint', async () => {
    await request(app.getHttpAdapter().getInstance()).get('/').expect(404);
  });
});
