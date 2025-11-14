import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Log environment variables for debugging
  console.log('[Main] Environment variables check:');
  console.log(
    '[Main] JWT_SECRET:',
    process.env.JWT_SECRET
      ? `${process.env.JWT_SECRET.substring(0, 4)}...`
      : 'NOT SET',
  );
  console.log(
    '[Main] JWT_EXPIRES_IN:',
    process.env.JWT_EXPIRES_IN || 'NOT SET',
  );
  console.log('[Main] DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('[Main] PORT:', process.env.PORT || 'NOT SET');

  const app = await NestFactory.create(AppModule, {
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
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🔐 Auth Service is running on: http://localhost:${port}`);
}
void bootstrap();
