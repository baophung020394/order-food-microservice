import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  // Log environment variables for debugging
  console.log('[OrderService] Environment variables check:');
  console.log('[OrderService] DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('[OrderService] DB_PORT:', process.env.DB_PORT || 'NOT SET');
  console.log(
    '[OrderService] ORDER_DB_NAME:',
    process.env.ORDER_DB_NAME || 'NOT SET',
  );
  console.log('[OrderService] PORT:', process.env.PORT || 'NOT SET');

  const app = await NestFactory.create(OrderServiceModule, {
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

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🛒 Order Service is running on: http://localhost:${port}`);
}
void bootstrap();
