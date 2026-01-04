import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { TableServiceModule } from './table-service.module';

async function bootstrap() {
  // Log environment variables for debugging
  console.log('[TableService] Environment variables check:');
  console.log('[TableService] DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('[TableService] DB_PORT:', process.env.DB_PORT || 'NOT SET');
  console.log(
    '[TableService] TABLE_DB_NAME:',
    process.env.TABLE_DB_NAME || 'NOT SET',
  );
  console.log('[TableService] PORT:', process.env.PORT || 'NOT SET');

  const app = await NestFactory.create(TableServiceModule, {
    bodyParser: true,
    rawBody: false,
  });

  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: false, // Validate all properties, but allow optional
      forbidNonWhitelisted: false, // Don't throw error for non-whitelisted properties
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🍽️  Table Service is running on: http://localhost:${port}`);
}
void bootstrap();
