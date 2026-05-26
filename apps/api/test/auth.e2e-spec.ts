import { INestApplication } from '@nestjs/common';
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
};

describe('AuthController (e2e)', () => {
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
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('logs in, returns the current user from the session, and logs out', async () => {
    const agent = request.agent(app.getHttpAdapter().getInstance());

    await agent.get('/auth/me').expect(401);

    await agent
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'change-me' })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({
          data: {
            ...admin,
            createdAt: admin.createdAt.toISOString(),
          },
        });
      });

    await agent
      .get('/auth/me')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          data: {
            ...admin,
            createdAt: admin.createdAt.toISOString(),
          },
        });
      });

    await agent.post('/auth/logout').expect(204);
    await agent.get('/auth/me').expect(401);
  });

  it('rejects login with an invalid password', async () => {
    await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong-password' })
      .expect(401);
  });
});
