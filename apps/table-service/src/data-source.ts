import { DataSource } from 'typeorm';
import { Table } from './entities/table.entity';
import { TableQR } from './entities/table-qr.entity';

// Note: Environment variables are loaded from:
// - Docker: docker-compose.yml environment section
// - Local: Set via export commands before running migrations

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.TABLE_DB_NAME || 'table_db',
  entities: [Table, TableQR],
  migrations: ['apps/table-service/src/migrations/*.ts'],
  synchronize: false, // Never use synchronize in production
  logging: process.env.DB_LOGGING === 'true',
});
