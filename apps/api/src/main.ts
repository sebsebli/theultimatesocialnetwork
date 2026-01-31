import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Response compression for better performance
  app.use(compression());

  // Protect /metrics when METRICS_SECRET is set (production: require X-Metrics-Secret or Bearer)
  const metricsSecret = process.env.METRICS_SECRET;
  if (metricsSecret) {
    const metricsMiddleware = (
      req: Request,
      res: Response,
      next: NextFunction,
    ): void => {
      const path: string = req.path ?? req.url?.split('?')[0] ?? '';
      if (path === '/metrics') {
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
    }),
  );

  // Global Error Handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful Shutdown
  app.enableShutdownHooks();

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // WebSocket Adapter (Redis for scaling)
  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
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
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
  });

  // Swagger API Documentation
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
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(
    `🚀 Citewalk API running on port ${port} [Env: ${process.env.NODE_ENV || 'development'}]`,
  );
}
void bootstrap();
