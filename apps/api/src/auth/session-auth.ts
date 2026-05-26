import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import passport from 'passport';
import type { EnvConfig } from '../config/env.validation';

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
  const isProduction = process.env.NODE_ENV === 'production';

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
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
}
