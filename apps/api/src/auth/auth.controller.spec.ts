import type { Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthenticatedRequest } from './auth.types';

describe('AuthController', () => {
  it('destroys the server session and clears the session cookie on logout', async () => {
    const controller = new AuthController();
    const request = {
      logout: jest.fn((callback: (error?: Error) => void) => callback()),
      session: {
        destroy: jest.fn((callback: (error?: Error) => void) => callback()),
      },
    } as unknown as AuthenticatedRequest;
    const response = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    await controller.logout(request, response);

    expect(request.logout).toHaveBeenCalledTimes(1);
    expect(request.session.destroy).toHaveBeenCalledTimes(1);
    expect(response.clearCookie).toHaveBeenCalledWith('linia.sid');
  });
});
