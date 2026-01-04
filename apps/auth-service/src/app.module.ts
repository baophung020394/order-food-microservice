// apps/auth-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Local modules/entities/controllers/services you have in auth-service
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RedisModule } from './config/redis.config';

// Entities (adjust import paths if you put entities under different folders)
import { User } from './auth/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';

@Module({
  imports: [
    // Global config, reads .env automatically
    // Note: In Docker, env vars from docker-compose.yml take precedence
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      // Load from process.env (Docker environment variables)
      ignoreEnvFile: false, // Still try to load .env files
      // process.env takes precedence over .env files
    }),

    // TypeORM config - async so we can use ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const dbConfig = {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
          username: config.get<string>('DB_USER', 'postgres'),
          password: config.get<string>('DB_PASS', 'postgres'),
          database: config.get<string>('DB_NAME', 'auth_db'),
          entities: [User, RefreshToken],
          // synchronize: true is convenient for dev only — set to false in production
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('DB_LOGGING', 'true') === 'true',
        };
        console.log('[AppModule] Database config:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
        });
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // JWT module for issuing tokens in AuthService
    // Make it global so AuthModule can use it without re-importing
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true, // Make JwtModule global so it can be used in AuthModule
      // @ts-expect-error - JwtModule type definitions are strict, but expiresIn accepts string like '1h' at runtime
      useFactory: (config: ConfigService) => {
        // Try multiple ways to get JWT_SECRET
        const jwtSecretFromEnv = process.env.JWT_SECRET;
        const jwtSecretFromConfig = config.get<string>('JWT_SECRET');
        const jwtSecret =
          jwtSecretFromEnv || jwtSecretFromConfig || 'supersecret';
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '1h';

        console.log('[AppModule] JWT config debug:');
        console.log(
          '  - process.env.JWT_SECRET:',
          jwtSecretFromEnv
            ? `${jwtSecretFromEnv.substring(0, 4)}...`
            : 'NOT SET',
        );
        console.log(
          '  - config.get("JWT_SECRET"):',
          jwtSecretFromConfig
            ? `${jwtSecretFromConfig.substring(0, 4)}...`
            : 'NOT SET',
        );
        console.log(
          '  - Final jwtSecret:',
          jwtSecret ? `${jwtSecret.substring(0, 4)}...` : 'NOT SET',
        );
        console.log('  - expiresIn:', expiresIn);

        if (!jwtSecret || jwtSecret.trim() === '') {
          console.error('[AppModule] ERROR: JWT_SECRET is empty or not set!');
          throw new Error('JWT_SECRET must be set in environment variables');
        }

        return {
          secret: jwtSecret,
          signOptions: {
            // expiresIn accepts string like '1h', '30m' or number (seconds)
            expiresIn: expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),

    // Redis module for message broker
    RedisModule,

    // Feature modules
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
