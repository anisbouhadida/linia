import {
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

  async validateUser(email: string, password: string): Promise<SafeUser> {
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSafeUser(user: UserWithPasswordHash): SafeUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}
