import { DataSource } from 'typeorm';
import { Table } from '../entities/table.entity';
import { TableQR } from '../entities/table-qr.entity';

// Note: Environment variables are loaded from:
// - Docker: docker-compose.yml environment section
// - Local: Set via export commands before running this script

async function runMigration() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.TABLE_DB_NAME || 'table_db',
    entities: [Table, TableQR],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if table_number column exists and its type
    const tableInfo = (await queryRunner.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tables' AND column_name = 'table_number'
    `)) as Array<{ column_name: string; data_type: string }>;

    if (tableInfo.length === 0) {
      console.log('⚠️  table_number column does not exist. Creating it...');
      await queryRunner.query(`
        ALTER TABLE "tables" ADD COLUMN "table_number" VARCHAR NOT NULL
      `);
      console.log('✅ Created table_number column as VARCHAR');
    } else if (tableInfo[0].data_type === 'integer') {
      console.log('🔄 Converting table_number from integer to varchar...');

      // Step 1: Add temporary column
      await queryRunner.query(`
        ALTER TABLE "tables" ADD COLUMN "table_number_temp" VARCHAR
      `);

      // Step 2: Convert existing values
      await queryRunner.query(`
        UPDATE "tables" SET "table_number_temp" = CAST("table_number" AS VARCHAR) 
        WHERE "table_number" IS NOT NULL
      `);

      // Step 3: Drop old column
      await queryRunner.query(`
        ALTER TABLE "tables" DROP COLUMN "table_number"
      `);

      // Step 4: Rename temp column
      await queryRunner.query(`
        ALTER TABLE "tables" RENAME COLUMN "table_number_temp" TO "table_number"
      `);

      // Step 5: Add constraints
      await queryRunner.query(`
        ALTER TABLE "tables" ALTER COLUMN "table_number" SET NOT NULL
      `);

      // Check if unique constraint exists
      const uniqueConstraint = (await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tables' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%table_number%'
      `)) as Array<{ constraint_name: string }>;

      if (uniqueConstraint.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "tables" ADD CONSTRAINT "UQ_tables_table_number" UNIQUE ("table_number")
        `);
      }

      console.log('✅ Migration completed successfully!');
    } else {
      console.log('✅ table_number is already VARCHAR. No migration needed.');
    }

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

void runMigration();
