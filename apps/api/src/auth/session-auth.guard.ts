import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Protects endpoints that require a Passport-authenticated session cookie.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  /**
   * Allows requests only when Passport has attached an authenticated session.
   *
   * @param context - Nest execution context for the protected request.
   * @returns True when Passport reports an authenticated request.
   * @throws UnauthorizedException when the request has no active login.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.isAuthenticated?.()) {
      return true;
    }

    throw new UnauthorizedException();
  }
}
