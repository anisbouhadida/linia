import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { configureSessionAuth } from './session-auth';
import type { EnvConfig } from '../config/env.validation';
import { PrismaService } from '../database/prisma.service';

jest.mock('express-session', () => {
  const sessionMiddleware = jest.fn();
  return Object.assign(
    jest.fn(() => sessionMiddleware),
    {
      Store: class Store {},
    },
  );
});

jest.mock('passport', () => ({
  initialize: jest.fn(() => jest.fn()),
  session: jest.fn(() => jest.fn()),
}));

describe('configureSessionAuth', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('rejects production startup without a persistent session store', () => {
    process.env.NODE_ENV = 'production';
    const app = { use: jest.fn() } as unknown as INestApplication;
    const configService = createConfigService({
      SESSION_SECRET: 'replace-with-long-random-secret',
      SESSION_STORE_DRIVER: 'memory',
    });

    expect(() => configureSessionAuth(app, configService)).toThrow(
      'Production requires SESSION_STORE_DRIVER=postgres',
    );
    expect(session).not.toHaveBeenCalled();
  });

  it('uses the configured Postgres session store in production', () => {
    process.env.NODE_ENV = 'production';
    const prisma = {
      $executeRawUnsafe: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    };
    const app = {
      get: jest.fn((token: unknown) => {
        if (token === PrismaService) {
          return prisma;
        }
        throw new Error('Unexpected provider');
      }),
      getHttpAdapter: jest.fn(() => ({
        getInstance: jest.fn(() => ({ set: jest.fn() })),
      })),
      use: jest.fn(),
    } as unknown as INestApplication;
    const configService = createConfigService({
      SESSION_SECRET: 'replace-with-long-random-secret',
      SESSION_STORE_DRIVER: 'postgres',
      SESSION_STORE_DATABASE_URL:
        'postgresql://linia:linia_password@localhost:5432/linia',
    });

    configureSessionAuth(app, configService);

    expect(session).toHaveBeenCalledWith(
      expect.objectContaining({
        store: expect.any(
          (session as unknown as { Store: new () => unknown }).Store,
        ),
      }),
    );
  });
});

function createConfigService(values: Partial<EnvConfig>) {
  return {
    getOrThrow: jest.fn((key: keyof EnvConfig) => {
      const value = values[key];
      if (value === undefined || value === null || value === '') {
        throw new Error(`${key} is required`);
      }
      return value;
    }),
    get: jest.fn((key: keyof EnvConfig, defaultValue?: unknown) => {
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService<EnvConfig>;
}
