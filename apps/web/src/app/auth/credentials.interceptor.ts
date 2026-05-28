import type { HttpInterceptorFn } from '@angular/common/http';

/**
 * Adds browser credentials to API requests so Linia's HTTP-only session cookie is sent.
 */
export const credentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ withCredentials: true }));
