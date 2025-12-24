-- Migration script to convert table_number from integer to varchar
-- Run this script if you have existing data in the tables table

-- Step 1: Add a temporary column with varchar type
ALTER TABLE "tables" ADD COLUMN "table_number_temp" VARCHAR;

-- Step 2: Convert existing integer values to string
UPDATE "tables" SET "table_number_temp" = CAST("table_number" AS VARCHAR) WHERE "table_number" IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE "tables" DROP COLUMN "table_number";

-- Step 4: Rename the temporary column to the original name
ALTER TABLE "tables" RENAME COLUMN "table_number_temp" TO "table_number";

-- Step 5: Add NOT NULL constraint and unique constraint
ALTER TABLE "tables" ALTER COLUMN "table_number" SET NOT NULL;
ALTER TABLE "tables" ADD CONSTRAINT "UQ_tables_table_number" UNIQUE ("table_number");








