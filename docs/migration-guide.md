# Migration Guide - Table Service

## Vấn đề

Khi thay đổi kiểu dữ liệu của một column trong database (ví dụ: `table_number` từ `integer` sang `varchar`), TypeORM `synchronize: true` không thể tự động migrate dữ liệu hiện có. Bạn cần chạy migration thủ công.

## Giải pháp

Có 3 cách để migrate:

### Cách 1: Chạy SQL Migration Script (Khuyến nghị - Nhanh nhất)

#### Nếu chạy trong Docker:

```bash
# Copy migration script vào container và chạy
docker cp docker/migrate-table-number-to-string.sql postgres-auth:/tmp/
docker exec -i postgres-auth psql -U postgres -d table_db < docker/migrate-table-number-to-string.sql

# Hoặc sử dụng script helper
pnpm run migration:table:run:sql
```

#### Nếu chạy local (PostgreSQL trên localhost:5433):

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5433
export DB_USER=postgres
export DB_PASS=Bapbap1412
export TABLE_DB_NAME=table_db

# Chạy migration
psql -h localhost -p 5433 -U postgres -d table_db -f docker/migrate-table-number-to-string.sql
```

### Cách 2: Chạy TypeScript Migration Script

```bash
# Set environment variables
export DB_HOST=postgres-auth  # hoặc localhost nếu chạy local
export DB_PORT=5432           # hoặc 5433 nếu chạy local
export DB_USER=postgres
export DB_PASS=Bapbap1412
export TABLE_DB_NAME=table_db

# Chạy migration script
pnpm run migration:table:run
```

### Cách 3: Drop và Recreate Table (Chỉ dùng khi không có dữ liệu quan trọng)

⚠️ **CẢNH BÁO**: Cách này sẽ xóa TẤT CẢ dữ liệu trong bảng `tables`!

```bash
# Kết nối vào database
docker exec -it postgres-auth psql -U postgres -d table_db

# Trong psql shell:
DROP TABLE IF EXISTS "tables" CASCADE;
DROP TABLE IF EXISTS "table_qr" CASCADE;

# Sau đó restart table-service, TypeORM sẽ tạo lại tables với schema mới
docker-compose restart table-service
```

## Migration Scripts

### 1. SQL Migration Script
- **File**: `docker/migrate-table-number-to-string.sql`
- **Mô tả**: Convert `table_number` từ `integer` sang `varchar`
- **Cách hoạt động**:
  1. Tạo column tạm `table_number_temp` kiểu VARCHAR
  2. Convert giá trị từ integer sang string
  3. Xóa column cũ
  4. Đổi tên column tạm thành `table_number`
  5. Thêm constraints (NOT NULL, UNIQUE)

### 2. TypeScript Migration Script
- **File**: `apps/table-service/src/migrations/run-migration.ts`
- **Mô tả**: Tự động detect và migrate nếu cần
- **Ưu điểm**: Tự động kiểm tra và chỉ migrate khi cần thiết

## Kiểm tra Migration

Sau khi chạy migration, kiểm tra schema:

```bash
# Kết nối vào database
docker exec -it postgres-auth psql -U postgres -d table_db

# Kiểm tra kiểu dữ liệu của table_number
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tables' AND column_name = 'table_number';

# Kết quả mong đợi:
# column_name  | data_type | is_nullable
# -------------+-----------+------------
# table_number | character varying | NO
```

## Best Practices

1. **Development**: Có thể dùng `synchronize: true` nhưng cần cẩn thận khi thay đổi kiểu dữ liệu
2. **Production**: Luôn dùng migrations, KHÔNG BAO GIỜ dùng `synchronize: true`
3. **Backup**: Luôn backup database trước khi chạy migration trong production
4. **Test**: Test migration trên staging environment trước

## Tạo Migration Mới

Khi cần thay đổi schema trong tương lai:

1. **Tắt synchronize** trong `table-service.module.ts`:
   ```typescript
   synchronize: false, // Never use in production
   ```

2. **Tạo migration file**:
   ```bash
   # Tạo file migration mới
   touch apps/table-service/src/migrations/YYYYMMDDHHMMSS-migration-name.ts
   ```

3. **Viết migration logic** trong file mới

4. **Chạy migration**:
   ```bash
   pnpm run migration:table:run
   ```

## Troubleshooting

### Lỗi: "column contains null values"
- **Nguyên nhân**: Có dữ liệu NULL trong column khi cố thêm NOT NULL constraint
- **Giải pháp**: Update dữ liệu NULL trước khi thêm constraint

### Lỗi: "relation already exists"
- **Nguyên nhân**: Column hoặc constraint đã tồn tại
- **Giải pháp**: Migration script đã có logic check, nhưng có thể cần điều chỉnh

### Lỗi: "connection refused"
- **Nguyên nhân**: Database không chạy hoặc sai connection info
- **Giải pháp**: Kiểm tra `docker ps` và environment variables








