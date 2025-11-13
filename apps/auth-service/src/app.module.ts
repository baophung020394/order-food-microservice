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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // TypeORM config - async so we can use ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'auth_db'),
        entities: [User, RefreshToken],
        // synchronize: true is convenient for dev only — set to false in production
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('DB_LOGGING', 'true') === 'true',
      }),
      inject: [ConfigService],
    }),

    // JWT module for issuing tokens in AuthService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // @ts-expect-error - JwtModule type definitions are strict, but expiresIn accepts string like '1h' at runtime
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '1h');
        return {
          secret: config.get<string>('JWT_SECRET', 'supersecret'),
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
