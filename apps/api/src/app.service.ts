import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getLive(): { data: { status: 'ok' } } {
    return { data: { status: 'ok' } };
  }

  async getReady(): Promise<{ data: { status: 'ok'; database: 'ok' } }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return { data: { status: 'ok', database: 'ok' } };
  }
}
