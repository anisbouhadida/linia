import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Route guard that verifies the server session before entering protected pages.
 *
 * A 401 from `/auth/me` is treated as an anonymous user and redirects to login;
 * other API failures are allowed to reject so Angular can surface the error.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.loadCurrentUser();

  return user ? true : router.parseUrl('/login');
};
