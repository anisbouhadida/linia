import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import type { EnvConfig } from '../config/env.validation';

/**
 * Nest-managed Prisma client configured with the PostgreSQL adapter.
 *
 * The service owns the database connection lifecycle for the API process and is
 * injected anywhere application code needs typed Prisma access.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Creates a Prisma client using the validated DATABASE_URL value.
   *
   * @param configService - ConfigService containing the validated DATABASE_URL.
   */
  constructor(configService: ConfigService<EnvConfig>) {
    super({
      adapter: new PrismaPg({
        connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  /**
   * Opens the database connection when Nest initializes the module.
   *
   * @returns Resolves once Prisma has connected.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Closes the database connection during graceful Nest shutdown.
   *
   * @returns Resolves once Prisma has disconnected.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
