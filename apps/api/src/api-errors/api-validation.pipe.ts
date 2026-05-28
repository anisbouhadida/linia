import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import type { ApiErrorDetail } from '@linia/shared';
import type { ValidationError } from 'class-validator';

/**
 * Creates the global request validation pipe used by all Nest controllers.
 *
 * Incoming JSON is transformed into DTO classes, unknown properties are rejected,
 * and validation failures are emitted in Linia's shared error-envelope shape.
 *
 * @returns A configured Nest validation pipe for global request validation.
 */
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

/**
 * Converts nested class-validator errors into dot-path details for API clients.
 *
 * @param errors - Validation errors produced by class-validator.
 * @param parentPath - Dot-path prefix used while flattening nested objects.
 * @returns Field-level validation details for the shared API error envelope.
 */
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
