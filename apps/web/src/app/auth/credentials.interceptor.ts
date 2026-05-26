import type { HttpInterceptorFn } from '@angular/common/http';

/** Adds browser credentials to API requests so the session cookie is sent. */
export const credentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ withCredentials: true }));
