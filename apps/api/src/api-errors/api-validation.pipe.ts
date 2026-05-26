import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import type { ApiErrorDetail } from '@linia/shared';
import type { ValidationError } from 'class-validator';

export function createApiValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: flattenValidationErrors(errors),
      }),
  });
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath?: string,
): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const details = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));

    if (!error.children?.length) {
      return details;
    }

    return [...details, ...flattenValidationErrors(error.children, field)];
  });
}
