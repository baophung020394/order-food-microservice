import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodServiceController } from './food-service.controller';
import { FoodServiceService } from './food-service.service';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { RedisModule } from './config/redis.config';

@Module({
  imports: [
    // Global config, reads .env automatically
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      ignoreEnvFile: false,
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
          database: config.get<string>('FOOD_DB_NAME', 'food_db'),
          entities: [Category, Dish],
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('DB_LOGGING', 'true') === 'true',
        };
        console.log('[FoodServiceModule] Database config:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
        });
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // Register repositories for Category and Dish
    TypeOrmModule.forFeature([Category, Dish]),

    // Redis module for message broker
    RedisModule,
  ],
  controllers: [FoodServiceController],
  providers: [FoodServiceService],
  exports: [FoodServiceService],
})
export class FoodServiceModule {}
