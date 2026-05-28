import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../database/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { LocalStrategy } from './local.strategy';
import { comparePassword, PASSWORD_COMPARE } from './password-compare';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionSerializer } from './session.serializer';

/**
 * Authentication module for the single seeded operator account.
 *
 * It registers Passport session support, local credential validation, and the
 * guards/serializer used by protected API endpoints.
 */
@Module({
  imports: [PrismaModule, PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalAuthGuard,
    LocalStrategy,
    SessionAuthGuard,
    SessionSerializer,
    {
      provide: PASSWORD_COMPARE,
      useValue: comparePassword,
    },
  ],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
