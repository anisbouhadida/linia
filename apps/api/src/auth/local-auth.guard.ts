import { BadRequestException, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Passport local-auth guard that validates payload shape before strategy execution.
 *
 * On successful credential validation it regenerates the session id before login
 * to avoid carrying an unauthenticated session identifier into the authenticated
 * state.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  /**
   * Validates credentials, rotates the session, and attaches the Passport user.
   *
   * @param context - Nest execution context for the login request.
   * @returns True when Passport accepts the credentials and the session is regenerated.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    assertLoginPayload(request.body);

    const canActivate = (await super.canActivate(context)) as boolean;
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await super.logIn(request);

    return canActivate;
  }
}

/**
 * Narrows unknown request bodies before Passport reads `email` and `password`.
 *
 * @param body - Raw request body supplied to the login endpoint.
 * @returns Narrows the body type when validation succeeds.
 * @throws BadRequestException when email or password is missing or not a string.
 */
function assertLoginPayload(body: unknown): asserts body is {
  email: string;
  password: string;
} {
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as { email?: unknown }).email !== 'string' ||
    typeof (body as { password?: unknown }).password !== 'string'
  ) {
    throw new BadRequestException('Email and password must be strings');
  }
}
