-- Script to create missing databases (order_db and food_db)
-- This script can be run manually if databases were not created during init

-- Create order_db if it doesn't exist
SELECT 'CREATE DATABASE order_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db')\gexec

-- Grant privileges to postgres user for order_db
GRANT ALL PRIVILEGES ON DATABASE order_db TO postgres;

-- Create food_db if it doesn't exist
SELECT 'CREATE DATABASE food_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'food_db')\gexec

-- Grant privileges to postgres user for food_db
GRANT ALL PRIVILEGES ON DATABASE food_db TO postgres;

