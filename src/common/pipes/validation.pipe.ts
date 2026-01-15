import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
      const messages = errors
        .map(err => Object.values(err.constraints ?? {}))
        .flat();

      return new BadRequestException({
        successful: false,
        error_code: ErrorCode.INVALID_INPUT,
        data: null,
        messages,
      });
    },
  });
}
