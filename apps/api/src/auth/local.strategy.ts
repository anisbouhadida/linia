import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import type { SafeUser } from './auth.types';

/**
 * Passport strategy that treats `email` as the local username field.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * Delegates credential validation to AuthService and returns the session-safe user.
   *
   * @param email - Email value read from Passport's configured username field.
   * @param password - Plain-text password supplied with the login request.
   * @returns The safe user Passport should attach to the request.
   */
  validate(email: string, password: string): Promise<SafeUser> {
    return this.authService.validateUser(email, password);
  }
}
