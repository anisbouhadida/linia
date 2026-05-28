/**
 * Minimal Prisma user delegate surface required by the admin seed helper.
 */
type UserModel = {
  findUnique(args: {
    where: { email: string };
    select: { email: true };
  }): Promise<{ email: string } | null>;
  create(args: {
    data: {
      email: string;
      passwordHash: string;
      displayName: string;
    };
    select: { email: true };
  }): Promise<{ email: string }>;
};

type SeedAdminPrisma = {
  user: UserModel;
};

/**
 * Inputs needed to create the initial operator account.
 */
type SeedAdminOptions = {
  adminEmail: string;
  adminInitialPassword: string;
  hashPassword: (password: string) => Promise<string>;
};

/**
 * Outcome reported by the seed script without exposing credential material.
 */
export type SeedAdminResult = {
  created: boolean;
  email: string;
};

/**
 * Ensures the configured admin account exists without changing an existing user.
 *
 * The email is normalized before lookup and creation so repeated seed runs are idempotent.
 *
 * @param prisma - Minimal Prisma client surface used to find or create a user.
 * @param options - Seed configuration and password hashing callback.
 * @returns Whether a user was created and the normalized admin email.
 */
export async function seedAdminUser(
  prisma: SeedAdminPrisma,
  options: SeedAdminOptions,
): Promise<SeedAdminResult> {
  const email = normalizeEmail(options.adminEmail);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });

  if (existingUser) {
    return {
      created: false,
      email: existingUser.email,
    };
  }

  const passwordHash = await options.hashPassword(options.adminInitialPassword);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Admin',
    },
    select: {
      email: true,
    },
  });

  return {
    created: true,
    email: user.email,
  };
}

/**
 * Canonicalizes the configured admin email for idempotent seeding.
 *
 * @param email - Raw admin email from environment configuration.
 * @returns Lowercase trimmed email address.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
