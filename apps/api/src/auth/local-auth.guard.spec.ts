import type { ExecutionContext } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  const authGuardPrototype = Object.getPrototypeOf(
    LocalAuthGuard.prototype,
  ) as {
    canActivate: (context: ExecutionContext) => Promise<boolean> | boolean;
    logIn: (request: unknown) => Promise<void>;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('regenerates the session before logging in the authenticated user', async () => {
    const events: string[] = [];
    const request = {
      session: {
        regenerate: jest.fn((callback: (error?: Error) => void) => {
          events.push('regenerate');
          callback();
        }),
      },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
    jest.spyOn(authGuardPrototype, 'canActivate').mockResolvedValue(true);
    const logInSpy = jest
      .spyOn(authGuardPrototype, 'logIn')
      .mockImplementation(async () => {
        events.push('login');
      });

    await expect(new LocalAuthGuard().canActivate(context)).resolves.toBe(true);

    expect(request.session.regenerate).toHaveBeenCalledTimes(1);
    expect(logInSpy).toHaveBeenCalledWith(request);
    expect(events).toEqual(['regenerate', 'login']);
  });
});
