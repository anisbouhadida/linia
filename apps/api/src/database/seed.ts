import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { validateEnv } from '../config/env.validation';
import { PrismaService } from './prisma.service';
import { seedAdminUser } from './seed-admin';

/**
 * Runs the database seed entrypoint used by Prisma.
 *
 * The seed currently creates or reuses the configured admin/operator account
 * and never rewrites an existing user's password.
 *
 * @returns Resolves after the seed operation logs its outcome and disconnects.
 */
async function main(): Promise<void> {
  const env = validateEnv(process.env);
  const configService = new ConfigService(env);
  const prisma = new PrismaService(configService);

  await prisma.$connect();

  try {
    const result = await seedAdminUser(prisma, {
      adminEmail: env.ADMIN_EMAIL,
      adminInitialPassword: env.ADMIN_INITIAL_PASSWORD,
      hashPassword: (password) => bcrypt.hash(password, 12),
    });

    const status = result.created ? 'Created' : 'Found existing';
    console.log(`${status} admin user: ${result.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
