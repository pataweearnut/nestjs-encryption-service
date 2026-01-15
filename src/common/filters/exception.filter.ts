import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';
import { Logger } from '@nestjs/common';

interface ErrorResponseBody {
  successful: false;
  error_code: ErrorCode;
  data: null;
  messages: string[];
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseBody: ErrorResponseBody;

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        responseBody = exceptionResponse as ErrorResponseBody;
      } else {
        responseBody = {
          successful: false,
          error_code: ErrorCode.INVALID_INPUT,
          data: null,
          messages: [String(exceptionResponse)],
        };
      }
    } else {
      responseBody = {
        successful: false,
        error_code: ErrorCode.INTERNAL_ERROR,
        data: null,
        messages: ['Internal server error'],
      };
    }

    this.logException(request, status, responseBody, exception);

    response.status(status).json(responseBody);
  }

  private logException(
    request: Request,
    status: number,
    body: ErrorResponseBody,
    exception: unknown,
  ): void {
    const baseLog = `method=${request.method} url=${request.originalUrl} status=${status} error_code=${body.error_code}`;

    if (status >= 500) {
      this.logger.error(
        baseLog,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${baseLog} messages=${body.messages.join(', ')}`);
    }
  }
}
