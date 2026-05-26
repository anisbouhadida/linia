import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureSessionAuth } from './auth/session-auth';
import type { EnvConfig } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvConfig>);

  configureSessionAuth(app, configService);

  await app.listen(configService.getOrThrow<number>('API_PORT'));
}
void bootstrap();
