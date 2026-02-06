import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { httpMetricsMiddleware } from './common/middleware/http-metrics.middleware';

const BODY_LIMIT = process.env.BODY_LIMIT || '1mb';
/** Global HTTP request timeout (ms). Prevents hung requests from consuming resources. */
const REQUEST_TIMEOUT_MS = parseInt(
  process.env.REQUEST_TIMEOUT_MS || '30000',
  10,
);

async function bootstrap() {
  // Safety net: prevent unhandled Redis socket errors from crashing the process.
  // The @redis/client emits SocketClosedUnexpectedlyError on Commander instances;
  // if any internal subscriber misses an error handler, this catches it.
  process.on('uncaughtException', (err) => {
    if (
      err?.name === 'SocketClosedUnexpectedlyError' ||
      err?.message?.includes('Socket closed unexpectedly')
    ) {
      console.error(
        `[UncaughtException] Redis socket error (non-fatal): ${err.message}`,
      );
      return; // Don't crash — Redis clients will reconnect
    }
    console.error('[UncaughtException] Fatal:', err);
    process.exit(1);
  });

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // All routes under /api so nginx can forward full path without rewriting
  app.setGlobalPrefix('api');

  // ── Request ID middleware (correlation ID for tracing) ──
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const existing = req.headers['x-request-id'];
    const requestId =
      typeof existing === 'string' && existing ? existing : randomUUID();
    req.headers['x-request-id'] = requestId;
    // Expose to response for client-side debugging
    _res.setHeader('X-Request-Id', requestId);
    next();
  });

  // ── HTTP request timeout ──
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for long-running endpoints (uploads, exports, WebSocket upgrades)
    const isUpgrade = req.headers['upgrade'] === 'websocket';
    const isUpload =
      req.path?.includes('/upload') || req.path?.includes('/export');
    if (isUpgrade || isUpload) return next();

    res.setTimeout(REQUEST_TIMEOUT_MS, () => {
      if (!res.headersSent) {
        res.status(408).json({ statusCode: 408, message: 'Request timeout' });
      }
    });
    next();
  });

  // Request body size limit (DoS prevention; posts/markdown typically < 1MB)
  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));

  // Response compression for better performance
  app.use(compression());

  // ── HTTP request metrics (Prometheus) ──
  app.use(httpMetricsMiddleware);

  // Enforce HTTPS in production when behind a reverse proxy (set ENFORCE_HTTPS=true)
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ENFORCE_HTTPS === 'true'
  ) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const proto = req.headers['x-forwarded-proto'];
      const isSecure =
        proto === 'https' || (Array.isArray(proto) && proto[0] === 'https');
      if (!isSecure) {
        res.status(403).json({
          statusCode: 403,
          message: 'HTTPS required',
        });
        return;
      }
      next();
    });
  }

  // Protect /metrics when METRICS_SECRET is set (production: require X-Metrics-Secret or Bearer)
  const metricsSecret = process.env.METRICS_SECRET;
  if (metricsSecret) {
    const metricsMiddleware = (
      req: Request,
      res: Response,
      next: NextFunction,
    ): void => {
      const path: string = req.path ?? req.url?.split('?')[0] ?? '';
      if (path === '/api/metrics' || path === '/metrics') {
        const authHeader = req.headers['authorization'];
        const secretHeader = req.headers['x-metrics-secret'];
        const provided = Array.isArray(secretHeader)
          ? secretHeader[0]
          : (secretHeader ??
            (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
              ? authHeader.slice(7)
              : undefined));
        if (provided !== metricsSecret) {
          res.status(401).json({
            statusCode: 401,
            message: 'Unauthorized',
          });
          return;
        }
      }
      next();
    };
    app.use(metricsMiddleware);
  }

  // Security headers with enhanced configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for markdown rendering
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'], // Allow images from any HTTPS source
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for images
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images from CDNs
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Additional security headers not covered by helmet
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    next();
  });

  // Global Error Handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful Shutdown (handles SIGTERM/SIGINT for clean worker/queue shutdown)
  app.enableShutdownHooks();

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // WebSocket Adapter (Redis for multi-instance scaling, in-memory fallback for single instance)
  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis(); // Handles errors internally, falls back to in-memory
  app.useWebSocketAdapter(redisIoAdapter);

  // Enable CORS with security (allow Expo/Metro in dev: exp://*)
  const explicitList = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:19006',
        'exp://localhost:19000',
      ];
  const allowOrigin = (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) return cb(null, true);
    if (explicitList.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production' && /^exp:\/\//.test(origin))
      return cb(null, true);
    return cb(null, false);
  };

  app.enableCors({
    origin: allowOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Metrics-Secret',
      'X-Health-Secret',
      'X-Forwarded-Proto',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
  });

  // Swagger API Documentation (served at /api/docs when global prefix is 'api')
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Citewalk API')
      .setDescription(
        'The social network for citations and verified information',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document); // under /api/docs
  }

  // Expose rate limit headers to clients
  const instance: unknown = app.getHttpAdapter().getInstance();
  const existingCors = (instance as { _corsOptions?: Record<string, unknown> })
    ._corsOptions;
  app.enableCors({
    ...existingCors,
    exposedHeaders: [
      'Content-Range',
      'X-Content-Range',
      'X-Total-Count',
      'X-Request-Id',
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
    ],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(
    `Citewalk API running on port ${port} [Env: ${process.env.NODE_ENV || 'development'}]`,
  );

  // ── Graceful shutdown with timeout ──
  const shutdownTimeout = 15000; // 15 seconds max
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, () => {
      void (async () => {
        logger.log(`Received ${signal}, shutting down gracefully...`);
        const timer = setTimeout(() => {
          logger.warn('Graceful shutdown timed out, forcing exit');
          process.exit(1);
        }, shutdownTimeout);
        try {
          await app.close();
          clearTimeout(timer);
          logger.log('Application closed gracefully');
          process.exit(0);
        } catch (err) {
          clearTimeout(timer);
          logger.error('Error during shutdown', err);
          process.exit(1);
        }
      })();
    });
  }
}
void bootstrap();
