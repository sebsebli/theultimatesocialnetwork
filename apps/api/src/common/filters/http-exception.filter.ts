import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { httpErrorTotal } from '../metrics';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Track error metrics
    const route =
      (request as { route?: { path?: string } }).route?.path ??
      (request as { path?: string }).path ??
      'unknown';
    httpErrorTotal.inc({
      method: request.method,
      route,
      status_code: String(status),
    });

    // Include request ID for tracing
    const requestId = request.headers['x-request-id'] as string | undefined;

    if (status === Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `HTTP 500 Error: ${request.method} ${request.url} [reqId=${requestId ?? 'none'}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    let errorMsg: string | object = message;
    if (
      typeof message === 'object' &&
      message !== null &&
      'message' in message
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      errorMsg = (message as any).message as string;
    }

    // In production: never leak internal details for 5xx errors
    const safeMessage =
      this.isProduction && status >= 500 ? 'Internal server error' : errorMsg;

    // Normalized error response — do NOT expose `path` in production (information leakage)
    const body: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: safeMessage,
    };
    if (!this.isProduction) {
      body.path = request.url;
    }
    if (requestId) {
      body.requestId = requestId;
    }

    response.status(status).json(body);
  }
}
