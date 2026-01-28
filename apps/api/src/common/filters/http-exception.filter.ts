import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** JWT verification errors from passport-jwt; treat as 401 so clients get Unauthorized, not 500. */
function isJwtAuthError(e: unknown): boolean {
  if (!(e && typeof e === 'object' && 'name' in e)) return false;
  const name = (e as { name?: string }).name;
  return (
    name === 'JsonWebTokenError' ||
    name === 'TokenExpiredError' ||
    name === 'UnauthorizedError'
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (isJwtAuthError(exception)) {
      status = HttpStatus.UNAUTHORIZED;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Structured logging for production
    const logData = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      status,
      userAgent: request.get('user-agent'),
      ip: request.ip || request.connection.remoteAddress,
      error:
        exception instanceof Error
          ? {
              message: exception.message,
              stack: isProduction ? undefined : exception.stack,
              name: exception.name,
            }
          : String(exception),
    };

    // Log full error details server-side using NestJS Logger (pino compatible)
    if (isProduction) {
      this.logger.error(JSON.stringify(logData));
    } else {
      this.logger.error(
        `[${request.method}] ${request.url} - Status: ${status}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    // Get message safely
    let message: string;
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? ((exceptionResponse as Record<string, any>).message as string) ||
            'An error occurred'
          : exceptionResponse;
    } else if (isJwtAuthError(exception)) {
      message = 'Unauthorized';
    } else {
      // In production, don't expose internal error details
      message = isProduction
        ? 'Internal server error'
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';
    }

    // Generate unique trace ID for tracking
    const traceId =
      request.get('x-trace-id') || Math.random().toString(36).substring(2, 15);

    // Normalize message structure with standard professional fields
    const errorResponse = {
      success: false,
      error: {
        code:
          status >= 500
            ? 'INTERNAL_SERVER_ERROR'
            : (exception as Error).name || 'BAD_REQUEST',
        message,
        statusCode: status,
        traceId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
      // Include stack only in dev
      ...(!isProduction && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    };

    response.status(status).json(errorResponse);
  }
}
