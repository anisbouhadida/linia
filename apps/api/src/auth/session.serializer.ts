import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { SafeUser } from './auth.types';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(
    user: SafeUser,
    done: (error: Error | null, id?: string) => void,
  ) {
    done(null, user.id);
  }

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
