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

const getSessionCookie = (setCookieHeader: string | string[] | undefined) => {
  const cookies =
    typeof setCookieHeader === 'string' ? [setCookieHeader] : setCookieHeader;

  return cookies?.find((cookie) => cookie.startsWith('linia.sid='));
};

const getSessionCookieValue = (
  setCookieHeader: string | string[] | undefined,
) => getSessionCookie(setCookieHeader)?.split(';')[0];

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('./../src/app.module').AppModule;
  const originalNodeEnv = process.env.NODE_ENV;

  const admin = {
    id: 'user-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    createdAt: new Date('2026-05-25T10:00:00.000Z'),
  };

  beforeAll(() => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_INITIAL_PASSWORD = 'change-me';
    ({ AppModule } = jest.requireActual('./../src/app.module'));
  });

  async function createAuthTestApp(): Promise<INestApplication<App>> {
    const passwordHash = await bcrypt.hash('change-me', 4);
    const prisma = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(0),
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
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

    const testApp = moduleFixture.createNestApplication();
    configureSessionAuth(testApp, {
      get: (key: string, defaultValue?: string) => {
        if (key === 'NODE_ENV') {
          return process.env.NODE_ENV ?? defaultValue ?? 'development';
        }
        if (key === 'SESSION_STORE_DRIVER') {
          return process.env.NODE_ENV === 'production' ? 'postgres' : 'memory';
        }
        return defaultValue;
      },
      getOrThrow: (key: string) => {
        if (key === 'SESSION_SECRET') {
          return 'test-session-secret';
        }
        throw new Error(`Unexpected config key: ${key}`);
      },
    } as ConfigService);
    await testApp.init();

    return testApp;
  }

  beforeEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    app = await createAuthTestApp();
  });

  const getHttpApp = (): App => app.getHttpServer();

  afterEach(async () => {
    await app?.close();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('logs in, returns the current user from the session, and logs out', async () => {
    const agent = request.agent(getHttpApp());

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

    await agent
      .post('/auth/logout')
      .expect(204)
      .expect(({ headers }) => {
        expect(getSessionCookie(headers['set-cookie'])).toContain(
          'linia.sid=;',
        );
      });
    await agent.get('/auth/me').expect(401);
  });

  it('regenerates the session cookie after each successful login', async () => {
    const agent = request.agent(getHttpApp());

    const firstLogin = await agent
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'change-me' })
      .expect(201);
    const firstSessionCookie = getSessionCookieValue(
      firstLogin.headers['set-cookie'],
    );

    const secondLogin = await agent
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'change-me' })
      .expect(201);
    const secondSessionCookie = getSessionCookieValue(
      secondLogin.headers['set-cookie'],
    );

    expect(firstSessionCookie).toBeDefined();
    expect(secondSessionCookie).toBeDefined();
    expect(secondSessionCookie).not.toEqual(firstSessionCookie);
  });

  it('rejects login with an invalid password', async () => {
    await request(getHttpApp())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('rejects malformed login payloads without a server error', async () => {
    await request(getHttpApp())
      .post('/auth/login')
      .send({ email: {}, password: {} })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toEqual({
          error: {
            code: 'BAD_REQUEST',
            message: 'Email and password must be strings',
            details: [],
          },
        });
      });

    await request(getHttpApp())
      .post('/auth/login')
      .send({ email: 123, password: false })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toEqual({
          error: {
            code: 'BAD_REQUEST',
            message: 'Email and password must be strings',
            details: [],
          },
        });
      });
  });

  it('sets a secure session cookie in production when TLS is terminated by a trusted proxy', async () => {
    await app.close();
    process.env.NODE_ENV = 'production';
    app = await createAuthTestApp();

    await request(getHttpApp())
      .post('/auth/login')
      .set('X-Forwarded-Proto', 'https')
      .send({ email: 'admin@example.com', password: 'change-me' })
      .expect(201)
      .expect(({ headers }) => {
        const cookies = headers['set-cookie'];

        expect(cookies).toEqual(
          expect.arrayContaining([
            expect.stringMatching(
              /^linia\.sid=.*;\sPath=\/;\sExpires=.*;\sHttpOnly;\sSecure;\sSameSite=Lax$/,
            ),
          ]),
        );
      });
  });
});
