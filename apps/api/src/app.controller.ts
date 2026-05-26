import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('live')
  getLive(): { data: { status: 'ok' } } {
    return this.appService.getLive();
  }

  @Get('ready')
  getReady(): Promise<{ data: { status: 'ok'; database: 'ok' } }> {
    return this.appService.getReady();
  }
}
