import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ApiExceptionFilter } from './api-errors/api-exception.filter';
import { createApiValidationPipe } from './api-errors/api-validation.pipe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { TemplatesModule } from './templates/templates.module';

/**
 * Root Nest module that wires global configuration, validation, error handling,
 * persistence, authentication, and the current MVP feature modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: createApiValidationPipe,
    },
  ],
})
export class AppModule {}
