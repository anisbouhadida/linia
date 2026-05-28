import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Exposes lightweight health probes for local development and deployment checks.
 */
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Reports process liveness without touching external dependencies.
   *
   * @returns Data envelope indicating the API process is alive.
   */
  @Get('live')
  getLive(): { data: { status: 'ok' } } {
    return this.appService.getLive();
  }

  /**
   * Reports readiness after verifying the database accepts a simple query.
   *
   * @returns Data envelope indicating API and database readiness.
   */
  @Get('ready')
  getReady(): Promise<{ data: { status: 'ok'; database: 'ok' } }> {
    return this.appService.getReady();
  }
}
