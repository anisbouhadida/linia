import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  comparePassword,
  PASSWORD_COMPARE,
  type PasswordCompare,
} from './password-compare';
import type { SafeUser } from './auth.types';

type UserWithPasswordHash = SafeUser & {
  passwordHash: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(PASSWORD_COMPARE)
    private readonly passwordCompare: PasswordCompare = comparePassword,
  ) {}

  /**
   * Validates login credentials and returns the user shape stored in sessions.
   *
   * @param email - User-submitted email address, normalized before lookup.
   * @param password - User-submitted plain-text password to compare with the stored hash.
   * @returns The safe user shape stored in the Passport session.
   * @throws BadRequestException when the payload does not contain string credentials.
   * @throws UnauthorizedException when the email is unknown or the password does not match.
   */
  async validateUser(email: string, password: string): Promise<SafeUser> {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new BadRequestException('Email and password must be strings');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        displayName: true,
        createdAt: true,
      },
    });

    if (!user || !(await this.passwordCompare(password, user.passwordHash))) {
      throw new UnauthorizedException();
    }

    return toSafeUser(user);
  }

  /**
   * Resolves the current session user without exposing password material.
   *
   * @param id - User id deserialized from the session.
   * @returns The user for an active session, or null when the stored id no longer exists.
   */
  async findSessionUser(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });
  }
}

/**
 * Canonicalizes emails for login and seeded-account lookup.
 *
 * @param email - Raw email address from credentials or configuration.
 * @returns Lowercase trimmed email address.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Removes credential material from a selected user record.
 *
 * @param user - Prisma user projection that includes the password hash.
 * @returns Safe user data allowed in sessions and API responses.
 */
function toSafeUser(user: UserWithPasswordHash): SafeUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}
