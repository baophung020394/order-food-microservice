import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FoodServiceModule } from './food-service.module';

async function bootstrap() {
  // Log environment variables for debugging
  console.log('[FoodService] Environment variables check:');
  console.log('[FoodService] DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('[FoodService] DB_PORT:', process.env.DB_PORT || 'NOT SET');
  console.log(
    '[FoodService] FOOD_DB_NAME:',
    process.env.FOOD_DB_NAME || 'NOT SET',
  );
  console.log('[FoodService] PORT:', process.env.PORT || 'NOT SET');

  const app = await NestFactory.create(FoodServiceModule, {
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

  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`🍜 Food Service is running on: http://localhost:${port}`);
}
void bootstrap();
