import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureSessionAuth } from './auth/session-auth';
import type { EnvConfig } from './config/env.validation';

/**
 * Starts the Nest API with validated configuration and session middleware.
 *
 * @returns Resolves after the API starts listening on the configured port.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvConfig>);

  configureSessionAuth(app, configService);

  await app.listen(configService.getOrThrow<number>('API_PORT'));
}
void bootstrap();
