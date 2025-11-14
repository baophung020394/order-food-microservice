# 🗄️ Database Guide - Docker vs DBeaver

## 📍 Vấn đề: DBeaver không thấy records nhưng Docker có data

### Giải thích:

**Docker PostgreSQL:**
- Chạy trong container `postgres-auth`
- Port mapping: `5433:5432` (host:container)
- Database: `auth_db`
- Data được lưu trong Docker volume: `postgres-auth-data`

**DBeaver (Local PostgreSQL):**
- Kết nối đến PostgreSQL local trên máy bạn
- Port: `5432` (default)
- Database: Có thể là database khác hoặc cùng tên nhưng khác instance

### ⚠️ QUAN TRỌNG:

**Khi chạy Docker, data được ghi vào Docker container, KHÔNG phải PostgreSQL local của bạn!**

```
┌─────────────────────────────────────────┐
│  Docker Container (postgres-auth)      │
│  Port: 5432 (inside container)         │
│  Host Port: 5433                        │
│  Database: auth_db                      │
│  Volume: postgres-auth-data             │
│  ✅ Auth Service ghi data vào đây       │
└─────────────────────────────────────────┘
              ↕ Port 5433
┌─────────────────────────────────────────┐
│  Your Local Machine                     │
│  DBeaver connects to:                  │
│  - localhost:5432 (Local PostgreSQL)   │
│  - localhost:5433 (Docker PostgreSQL)  │
└─────────────────────────────────────────┘
```

---

## 🔧 Cách kết nối DBeaver đến Docker PostgreSQL

### Bước 1: Tạo connection mới trong DBeaver

1. **New Database Connection** → **PostgreSQL**
2. **Main Settings:**
   - **Host:** `localhost`
   - **Port:** `5433` ⚠️ **QUAN TRỌNG: Dùng port 5433, không phải 5432!**
   - **Database:** `auth_db`
   - **Username:** `postgres`
   - **Password:** `postgres`

3. **Test Connection** → **Finish**

### Bước 2: Kiểm tra connection

Sau khi kết nối thành công, bạn sẽ thấy:
- Database: `auth_db`
- Schema: `public`
- Tables: `users`, `refresh_tokens`

---

## 📝 Hướng dẫn Query trong psql (Docker)

### Kết nối vào psql:

```bash
docker exec -it postgres-auth psql -U postgres -d auth_db
```

### Các lệnh psql cơ bản:

#### 1. **Xem danh sách tables:**
```sql
\dt
```

#### 2. **Xem cấu trúc table:**
```sql
\d users
\d refresh_tokens
```

#### 3. **Query dữ liệu:**

**Xem tất cả users:**
```sql
SELECT * FROM users;
```

**Xem users với format đẹp:**
```sql
\x  -- Toggle expanded display
SELECT * FROM users;
\x  -- Toggle back
```

**Xem số lượng users:**
```sql
SELECT COUNT(*) FROM users;
```

**Xem users theo username:**
```sql
SELECT id, username, full_name, role, is_active, created_at 
FROM users 
WHERE username = 'staff1';
```

**Xem refresh tokens:**
```sql
SELECT * FROM refresh_tokens;
```

**Xem refresh tokens với user info:**
```sql
SELECT 
  rt.id,
  rt.token,
  rt.expires_at,
  rt.created_at,
  u.username,
  u.full_name
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
ORDER BY rt.created_at DESC;
```

#### 4. **Xóa dữ liệu (Cẩn thận!):**

**Xóa một user:**
```sql
DELETE FROM users WHERE username = 'staff1';
```

**Xóa tất cả users:**
```sql
TRUNCATE TABLE users CASCADE;
```

**Xóa tất cả refresh tokens:**
```sql
TRUNCATE TABLE refresh_tokens;
```

#### 5. **Các lệnh psql hữu ích:**

```sql
-- Xem tất cả databases
\l

-- Kết nối đến database khác
\c database_name

-- Xem version PostgreSQL
SELECT version();

-- Xem thời gian hiện tại
SELECT NOW();

-- Thoát psql
\q
-- hoặc
exit
```

#### 6. **Format output:**

```sql
-- Set format columns
\pset format aligned
\pset border 2

-- Xem query với timing
\timing on
SELECT * FROM users;
\timing off
```

---

## 🔍 Debug: Kiểm tra data trong Docker

### Cách 1: Dùng psql (Terminal)

```bash
# Kết nối vào psql
docker exec -it postgres-auth psql -U postgres -d auth_db

# Xem tất cả users
SELECT * FROM users;

# Xem refresh tokens
SELECT * FROM refresh_tokens;

# Thoát
\q
```

### Cách 2: Dùng DBeaver

1. Kết nối đến `localhost:5433` (Docker PostgreSQL)
2. Navigate: `auth_db` → `Schemas` → `public` → `Tables`
3. Right-click `users` → **View Data**

### Cách 3: Dùng docker exec với SQL command

```bash
# Query trực tiếp từ command line
docker exec -it postgres-auth psql -U postgres -d auth_db -c "SELECT * FROM users;"

# Xem count
docker exec -it postgres-auth psql -U postgres -d auth_db -c "SELECT COUNT(*) FROM users;"
```

---

## 🐛 Troubleshooting

### Vấn đề: "Username already exists" nhưng DBeaver không thấy

**Nguyên nhân:**
- DBeaver đang kết nối đến PostgreSQL local (port 5432)
- Auth Service đang ghi vào Docker PostgreSQL (port 5433)

**Giải pháp:**
1. Kết nối DBeaver đến `localhost:5433` (Docker PostgreSQL)
2. Hoặc query trực tiếp trong Docker:
   ```bash
   docker exec -it postgres-auth psql -U postgres -d auth_db -c "SELECT * FROM users;"
   ```

### Vấn đề: Không thể kết nối đến port 5433

**Kiểm tra:**
```bash
# Xem container có đang chạy không
docker ps | grep postgres-auth

# Xem port mapping
docker port postgres-auth

# Xem logs
docker logs postgres-auth
```

### Vấn đề: Database không tồn tại

**Tạo database mới:**
```bash
docker exec -it postgres-auth psql -U postgres -c "CREATE DATABASE auth_db;"
```

---

## 📊 So sánh: Docker vs Local PostgreSQL

| Feature | Docker PostgreSQL | Local PostgreSQL |
|---------|------------------|------------------|
| **Port** | 5433 (host) | 5432 |
| **Host** | localhost | localhost |
| **Container** | postgres-auth | N/A |
| **Data Storage** | Docker volume | Local filesystem |
| **Connection String** | `postgresql://postgres:postgres@localhost:5433/auth_db` | `postgresql://postgres:postgres@localhost:5432/auth_db` |
| **Auth Service** | ✅ Kết nối đến đây | ❌ Không kết nối |

---

## ✅ Checklist

- [ ] DBeaver kết nối đến `localhost:5433` (Docker PostgreSQL)
- [ ] Có thể query `SELECT * FROM users;` trong psql
- [ ] Thấy data trong DBeaver khi kết nối đúng port
- [ ] Hiểu rõ sự khác biệt giữa Docker và Local PostgreSQL

---

**Lưu ý:** Luôn kiểm tra port khi kết nối DBeaver. Port 5433 = Docker, Port 5432 = Local PostgreSQL.

