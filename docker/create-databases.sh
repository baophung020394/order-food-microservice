#!/bin/bash
# Script to create missing databases in PostgreSQL container

echo "Creating missing databases (order_db and food_db)..."

# Create order_db
docker exec postgres-auth psql -U postgres -c "SELECT 'CREATE DATABASE order_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db')\gexec" || \
docker exec postgres-auth psql -U postgres -c "CREATE DATABASE order_db;" 2>/dev/null || echo "order_db may already exist"

# Grant privileges for order_db
docker exec postgres-auth psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE order_db TO postgres;" || echo "Failed to grant privileges for order_db"

# Create food_db
docker exec postgres-auth psql -U postgres -c "SELECT 'CREATE DATABASE food_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'food_db')\gexec" || \
docker exec postgres-auth psql -U postgres -c "CREATE DATABASE food_db;" 2>/dev/null || echo "food_db may already exist"

# Grant privileges for food_db
docker exec postgres-auth psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE food_db TO postgres;" || echo "Failed to grant privileges for food_db"

echo "Done! Checking databases..."
docker exec postgres-auth psql -U postgres -c "\l"

