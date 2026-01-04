import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
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
          database: config.get<string>('ORDER_DB_NAME', 'order_db'),
          entities: [Order, OrderItem],
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('DB_LOGGING', 'true') === 'true',
        };
        console.log('[OrderServiceModule] Database config:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
        });
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // Register repositories for Order and OrderItem
    TypeOrmModule.forFeature([Order, OrderItem]),

    // Redis module for message broker
    RedisModule,
  ],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
  exports: [OrderServiceService],
})
export class OrderServiceModule {}
