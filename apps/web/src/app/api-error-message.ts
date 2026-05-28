import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorResponse } from '@linia/shared';

/**
 * Converts Linia API error envelopes into compact UI messages.
 *
 * Validation details are preferred because they point users to the field-level
 * problem; otherwise the shared error message or caller fallback is used.
 *
 * @param error - Unknown error caught from an Angular API request.
 * @param fallback - Message to display when the error is not a Linia envelope.
 * @returns User-facing message suitable for compact alert text.
 */
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

/**
 * Presents authentication failures without leaking whether an email exists.
 *
 * @param error - Unknown login error caught from the API request.
 * @returns Safe authentication failure message.
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    return 'Invalid email or password';
  }

  return apiErrorMessage(error, 'Invalid email or password');
}

/**
 * Safely recognizes the shared API error envelope inside Angular HTTP errors.
 *
 * @param error - Unknown error value to inspect.
 * @returns The parsed API error envelope, or null when the shape is not trusted.
 */
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
