import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = process.env.NODE_ENV === 'production';
    
    // Log full error details server-side
    console.error(`[${request.method}] ${request.url} - Status: ${status}`, exception);

    // Get message safely
    let message: string;
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'object' 
        ? (exceptionResponse as any).message || 'An error occurred'
        : exceptionResponse as string;
    } else {
      // In production, don't expose internal error details
      message = isProduction 
        ? 'Internal server error' 
        : (exception instanceof Error ? exception.message : 'Internal server error');
    }

    // Normalize message structure
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // Only include stack trace in development
    if (!isProduction && exception instanceof Error && exception.stack) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
