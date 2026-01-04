import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => {
        const redisHost = config.get<string>('REDIS_HOST', 'localhost');
        const redisPort = config.get<number>('REDIS_PORT', 6379);
        const logger = new Logger('RedisModule');

        const redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: config.get<string>('REDIS_PASSWORD'),
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        redis.on('connect', () => {
          logger.log(`Connected to Redis at ${redisHost}:${redisPort}`);
        });

        redis.on('error', (error) => {
          logger.warn(
            `Redis connection error: ${error.message}. Service will continue without Redis events.`,
          );
        });

        redis.on('close', () => {
          logger.warn('Redis connection closed');
        });

        redis.connect().catch(() => {
          logger.warn(
            `Failed to connect to Redis at ${redisHost}:${redisPort}. Service will continue without Redis events.`,
          );
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
