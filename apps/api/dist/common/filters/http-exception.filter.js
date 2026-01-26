"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const isProduction = process.env.NODE_ENV === 'production';
        const logData = {
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.url,
            status,
            userAgent: request.get('user-agent'),
            ip: request.ip || request.connection.remoteAddress,
            error: exception instanceof Error ? {
                message: exception.message,
                stack: isProduction ? undefined : exception.stack,
                name: exception.name,
            } : String(exception),
        };
        if (isProduction) {
            console.error(JSON.stringify(logData));
        }
        else {
            console.error(`[${request.method}] ${request.url} - Status: ${status}`, exception);
        }
        let message;
        if (exception instanceof common_1.HttpException) {
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'object'
                ? exceptionResponse.message || 'An error occurred'
                : exceptionResponse;
        }
        else {
            message = isProduction
                ? 'Internal server error'
                : (exception instanceof Error ? exception.message : 'Internal server error');
        }
        const traceId = request.get('x-trace-id') || Math.random().toString(36).substring(2, 15);
        const errorResponse = {
            success: false,
            error: {
                code: status >= 500 ? 'INTERNAL_SERVER_ERROR' : exception.name || 'BAD_REQUEST',
                message,
                statusCode: status,
                traceId,
                timestamp: new Date().toISOString(),
                path: request.url,
            },
            ...(!isProduction && exception instanceof Error ? { stack: exception.stack } : {}),
        };
        response.status(status).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=http-exception.filter.js.map