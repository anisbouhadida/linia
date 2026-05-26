import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const createdAt = new Date('2026-05-25T10:00:00.000Z');

  it('returns a safe user when credentials are valid', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'admin@example.com',
          passwordHash: 'stored-hash',
          displayName: 'Admin',
          createdAt,
        }),
      },
    };
    const comparePassword = jest.fn().mockResolvedValue(true);
    const service = new AuthService(prisma, comparePassword);

    await expect(
      service.validateUser('Admin@Example.com', 'change-me'),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      displayName: 'Admin',
      createdAt,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        displayName: true,
        createdAt: true,
      },
    });
    expect(comparePassword).toHaveBeenCalledWith('change-me', 'stored-hash');
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const comparePassword = jest.fn();
    const service = new AuthService(prisma, comparePassword);

    await expect(
      service.validateUser('missing@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(comparePassword).not.toHaveBeenCalled();
  });

  it('loads the current user by serialized session id', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'admin@example.com',
          displayName: 'Admin',
          createdAt,
        }),
      },
    };
    const comparePassword = jest.fn();
    const service = new AuthService(prisma, comparePassword);

    await expect(service.findSessionUser('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      displayName: 'Admin',
      createdAt,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });
  });
});
