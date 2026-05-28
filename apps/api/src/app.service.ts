import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

/**
 * Provides health-check data used by the API health controller.
 */
@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns an in-process liveness response.
   *
   * @returns Data envelope indicating the API process is alive.
   */
  getLive(): { data: { status: 'ok' } } {
    return { data: { status: 'ok' } };
  }

  /**
   * Confirms the API can reach PostgreSQL before reporting readiness.
   *
   * @returns Data envelope indicating API and database readiness.
   */
  async getReady(): Promise<{ data: { status: 'ok'; database: 'ok' } }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return { data: { status: 'ok', database: 'ok' } };
  }
}
