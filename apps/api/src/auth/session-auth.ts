import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import passport from 'passport';
import type { EnvConfig } from '../config/env.validation';
import { PrismaService } from '../database/prisma.service';

/**
 * Registers session and Passport middleware for cookie-backed authentication.
 *
 * The session cookie is HTTP-only, uses the configured secret, and is marked
 * secure when the API runs with NODE_ENV set to production.
 */
export function configureSessionAuth(
  app: INestApplication,
  configService: ConfigService<EnvConfig>,
): void {
  const nodeEnv = configService.get<string>(
    'NODE_ENV',
    process.env.NODE_ENV ?? 'development',
  );
  const isProduction = nodeEnv === 'production';
  const store = createSessionStore(app, configService, isProduction);

  app.use(
    session({
      name: 'linia.sid',
      secret: configService.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 8,
      },
      ...(store ? { store } : {}),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
}

function createSessionStore(
  app: INestApplication,
  configService: ConfigService<EnvConfig>,
  isProduction: boolean,
): session.Store | undefined {
  const driver = configService.get<EnvConfig['SESSION_STORE_DRIVER']>(
    'SESSION_STORE_DRIVER',
    'memory',
  );

  if (driver === 'postgres') {
    return new PrismaSessionStore(app.get(PrismaService));
  }

  if (isProduction) {
    throw new Error('Production requires SESSION_STORE_DRIVER=postgres');
  }

  return undefined;
}

class PrismaSessionStore extends session.Store {
  private ready: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override get(
    sid: string,
    callback: (err: unknown, session?: session.SessionData | null) => void,
  ): void {
    void this.ensureReady()
      .then(() =>
        this.prisma.$queryRawUnsafe<{ sess: session.SessionData }[]>(
          'SELECT sess FROM linia_sessions WHERE sid = $1 AND expire > NOW()',
          sid,
        ),
      )
      .then((sessions) => callback(null, sessions[0]?.sess ?? null))
      .catch((error: unknown) => callback(error));
  }

  override set(
    sid: string,
    sessionData: session.SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    void this.ensureReady()
      .then(() =>
        this.prisma.$executeRawUnsafe(
          `INSERT INTO linia_sessions (sid, sess, expire)
           VALUES ($1, $2, $3)
           ON CONFLICT (sid)
           DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
          sid,
          JSON.stringify(sessionData),
          this.getExpiry(sessionData),
        ),
      )
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }

  override destroy(sid: string, callback?: (err?: unknown) => void): void {
    void this.ensureReady()
      .then(() =>
        this.prisma.$executeRawUnsafe(
          'DELETE FROM linia_sessions WHERE sid = $1',
          sid,
        ),
      )
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }

  override touch(
    sid: string,
    sessionData: session.SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    void this.ensureReady()
      .then(() =>
        this.prisma.$executeRawUnsafe(
          'UPDATE linia_sessions SET expire = $2 WHERE sid = $1',
          sid,
          this.getExpiry(sessionData),
        ),
      )
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }

  private ensureReady(): Promise<void> {
    this.ready ??= this.ensureTable();
    return this.ready;
  }

  private async ensureTable(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS linia_sessions (
        sid varchar PRIMARY KEY,
        sess json NOT NULL,
        expire timestamptz NOT NULL
      )
    `);
    await this.prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS linia_sessions_expire_idx ON linia_sessions (expire)',
    );
  }

  private getExpiry(sessionData: session.SessionData): Date {
    const cookie = sessionData.cookie;
    const expires = cookie.expires;

    if (expires) {
      return new Date(expires);
    }

    return new Date(Date.now() + (cookie.maxAge ?? 1000 * 60 * 60 * 8));
  }
}
