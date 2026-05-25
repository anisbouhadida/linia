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

type SeedAdminOptions = {
  adminEmail: string;
  adminInitialPassword: string;
  hashPassword: (password: string) => Promise<string>;
};

export type SeedAdminResult = {
  created: boolean;
  email: string;
};

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
