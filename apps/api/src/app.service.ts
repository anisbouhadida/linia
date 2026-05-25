import { Injectable } from '@nestjs/common';
import type { RunStatus } from '@linia/shared';

@Injectable()
export class AppService {
  private readonly defaultRunStatus: RunStatus = 'ACTIVE';

  getHello(): string {
    return 'Hello World!';
  }
}
