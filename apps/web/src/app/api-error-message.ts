import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorResponse } from '@linia/shared';

export function apiErrorMessage(error: unknown, fallback: string): string {
  const apiError = extractApiError(error);
  if (!apiError) {
    return fallback;
  }

  const detailMessages = apiError.error.details
    .map((detail) => detail.message.trim())
    .filter(Boolean);

  if (detailMessages.length > 0) {
    return detailMessages.join(' ');
  }

  return apiError.error.message || fallback;
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    return 'Invalid email or password';
  }

  return apiErrorMessage(error, 'Invalid email or password');
}

function extractApiError(error: unknown): ApiErrorResponse | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }

  const body = error.error;
  if (
    typeof body !== 'object' ||
    body === null ||
    !('error' in body) ||
    typeof body.error !== 'object' ||
    body.error === null
  ) {
    return null;
  }

  const apiError = body as ApiErrorResponse;
  if (
    typeof apiError.error.code !== 'string' ||
    typeof apiError.error.message !== 'string' ||
    !Array.isArray(apiError.error.details) ||
    !apiError.error.details.every(
      (detail) =>
        typeof detail === 'object' &&
        detail !== null &&
        typeof (detail as { message?: unknown }).message === 'string',
    )
  ) {
    return null;
  }

  return apiError;
}
