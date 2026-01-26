import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Response compression for better performance
  app.use(compression());

  // Security headers with enhanced configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for markdown rendering
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"], // Allow images from any HTTPS source
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for images
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from CDNs
  }));

  // Global Error Handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Enable CORS with security
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:19006', 'exp://localhost:19000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
  });
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 CITE API running on port ${port} [Env: ${process.env.NODE_ENV || 'development'}]`);
}
bootstrap();
