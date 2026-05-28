import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { SafeUser } from './auth.types';

/**
 * Persists only the user id in the session and reloads the safe user per request.
 */
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  /**
   * Stores the stable user id in express-session.
   *
   * @param user - Safe user attached by Passport after login.
   * @param done - Passport callback that receives the serializable session id.
   */
  serializeUser(
    user: SafeUser,
    done: (error: Error | null, id?: string) => void,
  ) {
    done(null, user.id);
  }

  /**
   * Resolves the session id back to a safe user or invalidates stale sessions.
   *
   * @param id - User id stored in the session.
   * @param done - Passport callback that receives a safe user or false.
   * @returns Resolves after the lookup result is passed to Passport.
   */
  async deserializeUser(
    id: string,
    done: (error: Error | null, user?: SafeUser | false) => void,
  ) {
    try {
      const user = await this.authService.findSessionUser(id);
      done(null, user ?? false);
    } catch (error) {
      done(
        error instanceof Error
          ? error
          : new Error('Failed to deserialize user'),
      );
    }
  }
}
