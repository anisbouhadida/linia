import { seedAdminUser } from './seed-admin';

describe('seedAdminUser', () => {
  it('creates the admin user with a hashed password when missing', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'admin@example.com',
          displayName: 'Admin',
        }),
      },
    };
    const hashPassword = jest.fn().mockResolvedValue('hashed-password');

    await expect(
      seedAdminUser(prisma, {
        adminEmail: 'Admin@Example.com',
        adminInitialPassword: 'change-me',
        hashPassword,
      }),
    ).resolves.toEqual({
      created: true,
      email: 'admin@example.com',
    });

    expect(hashPassword).toHaveBeenCalledWith('change-me');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'admin@example.com',
        passwordHash: 'hashed-password',
        displayName: 'Admin',
      },
      select: {
        email: true,
      },
    });
  });

  it('leaves an existing admin user unchanged', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'admin@example.com',
        }),
        create: jest.fn(),
      },
    };
    const hashPassword = jest.fn();

    await expect(
      seedAdminUser(prisma, {
        adminEmail: 'admin@example.com',
        adminInitialPassword: 'change-me',
        hashPassword,
      }),
    ).resolves.toEqual({
      created: false,
      email: 'admin@example.com',
    });

    expect(hashPassword).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
