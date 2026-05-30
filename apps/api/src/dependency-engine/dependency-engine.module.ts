import { Module } from '@nestjs/common';
import { DependencyEngineService } from './dependency-engine.service';

/**
 * Server-side task dependency calculation for live run boards.
 */
@Module({
  providers: [DependencyEngineService],
  exports: [DependencyEngineService],
})
export class DependencyEngineModule {}
