import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { SessionAuthGuard } from './session-auth.guard';
import type { AuthenticatedRequest, SafeUser } from './auth.types';

@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() request: AuthenticatedRequest): { data: SafeUser } {
    return { data: request.user as SafeUser };
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest): { data: SafeUser } {
    return { data: request.user as SafeUser };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Req() request: AuthenticatedRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      request.logout((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
