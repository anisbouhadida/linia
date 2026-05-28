import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global persistence module that exposes the shared PrismaService singleton.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
