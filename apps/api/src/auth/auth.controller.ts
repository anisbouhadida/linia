import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { LocalAuthGuard } from './local-auth.guard';
import { SessionAuthGuard } from './session-auth.guard';
import type { AuthenticatedRequest, SafeUser } from './auth.types';

/**
 * Session-authentication endpoints for the single-operator MVP.
 *
 * Login is delegated to Passport's local strategy and guard so successful
 * responses always include a regenerated session cookie. Logout destroys the
 * server-side session before clearing the browser cookie.
 */
@Controller('auth')
export class AuthController {
  /**
   * Authenticates credentials and returns the safe user stored on the request.
   *
   * @param request - Express request after LocalAuthGuard attaches the user.
   * @returns Data envelope containing the authenticated safe user.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() request: AuthenticatedRequest): { data: SafeUser } {
    return { data: request.user as SafeUser };
  }

  /**
   * Returns the current user when the session cookie resolves to an active user.
   *
   * @param request - Express request after SessionAuthGuard verifies the session.
   * @returns Data envelope containing the current safe user.
   */
  @UseGuards(SessionAuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest): { data: SafeUser } {
    return { data: request.user as SafeUser };
  }

  /**
   * Ends the current Passport session and clears Linia's HTTP-only cookie.
   *
   * @param request - Authenticated request with Passport logout and session helpers.
   * @param response - Passthrough response used to clear the session cookie.
   * @returns Resolves after logout, session destruction, and cookie clearing finish.
   */
  @Post('logout')
  @HttpCode(204)
  logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      request.logout((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        request.session.destroy((destroyError?: Error) => {
          if (destroyError) {
            reject(destroyError);
            return;
          }
          response.clearCookie('linia.sid');
          resolve();
        });
      });
    });
  }
}
