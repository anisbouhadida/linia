import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type {
  ApiErrorCode,
  ApiErrorDetail,
  ApiErrorResponse,
} from '@linia/shared';

type HttpExceptionPayload = string | Record<string, unknown>;

const HTTP_STATUS_CODES: Partial<Record<HttpStatus, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

/**
 * Converts all thrown NestJS and unexpected exceptions into Linia's API error envelope.
 *
 * The filter intentionally hides details for unhandled server errors while preserving
 * normalized code/message/details values supplied by expected HTTP exceptions.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  /**
   * Writes a JSON error response using the status carried by an HttpException.
   *
   * @param exception - Thrown value captured by Nest's exception layer.
   * @param host - Current request context used to access the HTTP response.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = getHttpStatus(exception);

    response.status(status).json({
      error: toApiError(exception, status),
    } satisfies ApiErrorResponse);
  }
}

/**
 * Resolves the HTTP status to send for a thrown value.
 *
 * @param exception - Thrown value that may be a Nest HttpException.
 * @returns The exception status or 500 for non-HTTP errors.
 */
function getHttpStatus(exception: unknown): HttpStatus {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Builds the stable API error payload consumed by Angular and shared tests.
 *
 * @param exception - Thrown value that may carry a Nest response payload.
 * @param status - HTTP status already chosen for the response.
 * @returns The normalized error object inside Linia's error envelope.
 */
function toApiError(
  exception: unknown,
  status: HttpStatus,
): ApiErrorResponse['error'] {
  const payload = getExceptionPayload(exception);
  const normalized = normalizePayload(payload);
  const fallbackCode = HTTP_STATUS_CODES[status] ?? 'INTERNAL_ERROR';

  if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    };
  }

  return {
    code: normalized.code ?? fallbackCode,
    message: normalized.message ?? defaultMessageFor(status),
    details: normalized.details ?? [],
  };
}

/**
 * Extracts the response body from Nest HTTP exceptions.
 *
 * @param exception - Thrown value to inspect.
 * @returns The raw Nest exception payload, or undefined for unexpected errors.
 */
function getExceptionPayload(
  exception: unknown,
): HttpExceptionPayload | undefined {
  if (exception instanceof HttpException) {
    return exception.getResponse() as HttpExceptionPayload;
  }

  return undefined;
}

/**
 * Accepts Nest's flexible exception response shapes and keeps only Linia fields.
 *
 * @param payload - Raw exception response body from Nest.
 * @returns Recognized code, message, and details fields.
 */
function normalizePayload(payload: HttpExceptionPayload | undefined): {
  code?: ApiErrorCode;
  message?: string;
  details?: ApiErrorDetail[];
} {
  if (typeof payload === 'string') {
    return { message: payload };
  }

  if (!payload) {
    return {};
  }

  return {
    code:
      typeof payload.code === 'string'
        ? (payload.code as ApiErrorCode)
        : undefined,
    message: normalizeMessage(payload.message),
    details: normalizeDetails(payload.details),
  };
}

/**
 * Collapses Nest validation message arrays into a single response message.
 *
 * @param message - Unknown message shape from an exception payload.
 * @returns A single message string when the payload contains one.
 */
function normalizeMessage(message: unknown): string | undefined {
  if (typeof message === 'string') {
    return message;
  }

  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === 'string')
  ) {
    return message.join(', ');
  }

  return undefined;
}

/**
 * Keeps validation detail entries that contain a usable human-readable message.
 *
 * @param details - Unknown details shape from an exception payload.
 * @returns Normalized detail entries, or undefined when the shape is invalid.
 */
function normalizeDetails(details: unknown): ApiErrorDetail[] | undefined {
  if (!Array.isArray(details)) {
    return undefined;
  }

  return details.reduce<ApiErrorDetail[]>((normalizedDetails, detail) => {
    if (typeof detail === 'object' && detail !== null && 'message' in detail) {
      const candidate = detail as Record<string, unknown>;
      if (typeof candidate.message !== 'string') {
        return normalizedDetails;
      }

      normalizedDetails.push({
        field:
          typeof candidate.field === 'string' ? candidate.field : undefined,
        message: candidate.message,
      });
    }

    return normalizedDetails;
  }, []);
}

/**
 * Provides generic messages when an exception does not include one.
 *
 * @param status - HTTP status used for the response.
 * @returns A generic message appropriate for the status.
 */
function defaultMessageFor(status: HttpStatus): string {
  if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
    return 'Validation failed';
  }

  return 'Request failed';
}
