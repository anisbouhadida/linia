import { BadRequestException, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    assertLoginPayload(request.body);

    const canActivate = (await super.canActivate(context)) as boolean;
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await super.logIn(request);

    return canActivate;
  }
}

function assertLoginPayload(body: unknown): asserts body is {
  email: string;
  password: string;
} {
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as { email?: unknown }).email !== 'string' ||
    typeof (body as { password?: unknown }).password !== 'string'
  ) {
    throw new BadRequestException('Email and password must be strings');
  }
}
