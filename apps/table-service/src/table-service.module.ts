import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableServiceController } from './table-service.controller';
import { TableServiceService } from './table-service.service';
import { Table } from './entities/table.entity';
import { TableQR } from './entities/table-qr.entity';
import { RedisModule } from '../config/redis.config';

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
          database: config.get<string>('TABLE_DB_NAME', 'table_db'),
          entities: [Table, TableQR],
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('DB_LOGGING', 'true') === 'true',
        };
        console.log('[TableServiceModule] Database config:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
        });
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // Register repositories for Table and TableQR
    TypeOrmModule.forFeature([Table, TableQR]),

    // Redis module for message broker
    RedisModule,
  ],
  controllers: [TableServiceController],
  providers: [TableServiceService],
  exports: [TableServiceService],
})
export class TableServiceModule {}
