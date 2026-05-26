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

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = getHttpStatus(exception);

    response.status(status).json({
      error: toApiError(exception, status),
    } satisfies ApiErrorResponse);
  }
}

function getHttpStatus(exception: unknown): HttpStatus {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
}

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

function getExceptionPayload(
  exception: unknown,
): HttpExceptionPayload | undefined {
  if (exception instanceof HttpException) {
    return exception.getResponse() as HttpExceptionPayload;
  }

  return undefined;
}

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

function defaultMessageFor(status: HttpStatus): string {
  if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
    return 'Validation failed';
  }

  return 'Request failed';
}
