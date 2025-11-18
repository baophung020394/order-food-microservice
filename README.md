# 🍽️ Restaurant Ordering App — Microservices

**Version:** 1.0  
**Last Updated:** 2025-01-XX

A Restaurant Ordering System built with NestJS microservices architecture. This system allows staff to take customer orders per table, send them to the kitchen, and process payments efficiently.

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Services Overview](#-services-overview)
- [Quick Start](#-quick-start)
- [Service Details](#-service-details)
- [API Documentation](#-api-documentation)
- [Socket.IO Events](#-socketio-events)
- [Development](#-development)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)

---

## 🏗️ Architecture

This project follows **microservice design principles** with independent services communicating via:

- **HTTP/REST** for synchronous queries
- **Redis Streams** for asynchronous event-driven updates
- **Socket.IO** for real-time frontend updates

### Communication Flow

```
Client → API Gateway → Microservices
                ↓
            Redis (Events)
                ↓
         Socket.IO (Realtime)
```

---

## 📦 Services Overview

| Service          | Purpose                                                   | Port | Database  | Status   |
| ---------------- | --------------------------------------------------------- | ---- | --------- | -------- |
| **API Gateway**  | Entry point, routing, authentication proxy, Socket.IO hub | 3000 | N/A       | ✅ Ready |
| **Auth Service** | User management, authentication, JWT token issuance       | 3001 | `auth_db` | ✅ Ready |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** (package manager)
- **Docker** & **Docker Compose**
- **PostgreSQL** 16+ (via Docker)
- **Redis** 7+ (via Docker)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd restaurant-microservices

# Install dependencies
pnpm install
```

### Environment Variables

#### 📍 **TÓM TẮT: Tạo file `.env` ở đâu?**

**✅ TRẢ LỜI: Tạo file `.env` ở ROOT của project (cùng cấp với `package.json`)**

```
restaurant-microservices/          ← ROOT của project
├── .env                           ← ✅ TẠO FILE Ở ĐÂY
├── .env.example                   ← Template (đã có sẵn)
├── package.json
├── docker-compose.yml
└── apps/
    ├── api-gateway/
    └── auth-service/
```

#### 🔧 **Hướng dẫn Setup**

**Bước 1: Tạo file `.env` ở ROOT**

```bash
# Từ root của project
cd restaurant-microservices

# Copy file template
cp .env.example .env

# File .env đã được tạo ở root
# Bây giờ bạn có thể chỉnh sửa nếu cần
```

**Bước 2: Nội dung file `.env` (đã có trong `.env.example`)**

File `.env` ở root sẽ chứa TẤT CẢ các biến môi trường cho TẤT CẢ services:

**Cho 2 services hiện tại (Gateway + Auth):**

```env
# ============================================
# Global/Shared Configuration
# ============================================
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=supersecret_change_in_production
JWT_EXPIRES_IN=1h

# ============================================
# API Gateway Configuration
# ============================================
GATEWAY_PORT=3000
AUTH_SERVICE_URL=http://localhost:3001

# ============================================
# Auth Service Configuration
# ============================================
AUTH_PORT=3001
AUTH_DB_HOST=localhost
AUTH_DB_PORT=5432
AUTH_DB_USER=postgres
AUTH_DB_PASS=postgres
AUTH_DB_NAME=auth_db
AUTH_DB_LOGGING=true

# Backward compatibility (Auth Service vẫn đọc được)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=auth_db
DB_LOGGING=true
```

**Khi có nhiều services (8+ services):**

```env
# ============================================
# Global/Shared
# ============================================
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=supersecret

# ============================================
# API Gateway
# ============================================
GATEWAY_PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
MENU_SERVICE_URL=http://localhost:3003
TABLE_SERVICE_URL=http://localhost:3004
KITCHEN_SERVICE_URL=http://localhost:3005
BILLING_SERVICE_URL=http://localhost:3006

# ============================================
# Auth Service
# ============================================
AUTH_PORT=3001
AUTH_DB_HOST=localhost
AUTH_DB_NAME=auth_db
AUTH_DB_USER=postgres
AUTH_DB_PASS=postgres

# ============================================
# Order Service
# ============================================
ORDER_PORT=3002
ORDER_DB_HOST=localhost
ORDER_DB_NAME=order_db
ORDER_DB_USER=postgres
ORDER_DB_PASS=postgres

# ============================================
# Menu Service
# ============================================
MENU_PORT=3003
MENU_DB_HOST=localhost
MENU_DB_NAME=menu_db
# ... và cứ thế cho các services khác
```

**⚠️ Lưu ý quan trọng:**

1. **Dùng SERVICE_PREFIX** để tránh conflict:
   - ✅ `AUTH_DB_HOST`, `ORDER_DB_HOST`, `MENU_DB_HOST`
   - ❌ `DB_HOST` (không rõ là của service nào)

2. **PORT cho mỗi service:**
   - ✅ `GATEWAY_PORT=3000`, `AUTH_PORT=3001`, `ORDER_PORT=3002`
   - ❌ `PORT=3000` (conflict khi nhiều services)

3. **Shared configs không cần prefix:**
   - ✅ `REDIS_HOST`, `JWT_SECRET`, `NODE_ENV` (dùng chung)
   - ✅ `AUTH_SERVICE_URL`, `ORDER_SERVICE_URL` (Gateway cần biết URLs)

#### 📁 **Cấu trúc File**

```
restaurant-microservices/
├── .env                    # ✅ TẠO FILE NÀY (copy từ .env.example)
├── .env.local              # Optional: Local overrides (gitignored)
├── .env.example           # ✅ Template (đã có sẵn)
└── apps/
    ├── api-gateway/       # KHÔNG cần .env ở đây
    └── auth-service/      # KHÔNG cần .env ở đây
```

#### 🔄 **Cách NestJS đọc Environment Variables**

Cả 2 services đều đọc từ **ROOT `.env`** theo thứ tự ưu tiên:

1. **System environment variables** (cao nhất)
2. **`.env.local`** ở root (nếu có)
3. **`.env`** ở root ← **FILE CHÍNH**
4. **Default values** trong code (thấp nhất)

**Code configuration:**
```typescript
// apps/auth-service/src/app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env', '.env.local'], // Đọc từ ROOT
})

// apps/api-gateway/src/api-gateway.module.ts  
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env', '.env.local'], // Đọc từ ROOT
})
```

#### 🐳 **Docker Compose**

Khi chạy với Docker Compose, các biến môi trường được set trực tiếp trong `docker-compose.yml`, KHÔNG cần file `.env`:

```yaml
auth-service:
  environment:
    PORT: 3001
    DB_HOST: postgres-auth
    # ... các biến khác
```

**Tuy nhiên**, bạn có thể dùng `env_file` để load từ `.env`:

```yaml
auth-service:
  env_file:
    - .env  # Load từ root .env
```


#### 🎯 **Với nhiều Services (8+ services) - Vẫn chỉ cần 1 file `.env` ở ROOT**

Khi project có nhiều services (Auth, Order, Menu, Table, Kitchen, Billing, etc.), bạn **VẪN CHỈ CẦN 1 file `.env` ở root**, nhưng cần dùng **SERVICE PREFIX** để tránh conflict:

**Strategy: Service Prefix Pattern**

```env
# ✅ ĐÚNG: Dùng prefix để phân biệt
AUTH_DB_HOST=localhost
AUTH_DB_NAME=auth_db
ORDER_DB_HOST=localhost
ORDER_DB_NAME=order_db
MENU_DB_HOST=localhost
MENU_DB_NAME=menu_db

# ❌ SAI: Không dùng prefix → Conflict!
DB_HOST=localhost  # Service nào sẽ dùng?
DB_NAME=???        # Không rõ là của service nào
```

**Ví dụ `.env` với nhiều services:**

```env
# ============================================
# Global/Shared Configuration
# ============================================
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=supersecret

# ============================================
# API Gateway
# ============================================
GATEWAY_PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
MENU_SERVICE_URL=http://localhost:3003

# ============================================
# Auth Service
# ============================================
AUTH_PORT=3001
AUTH_DB_HOST=localhost
AUTH_DB_NAME=auth_db
AUTH_DB_USER=postgres
AUTH_DB_PASS=postgres

# ============================================
# Order Service (Future)
# ============================================
ORDER_PORT=3002
ORDER_DB_HOST=localhost
ORDER_DB_NAME=order_db
ORDER_DB_USER=postgres
ORDER_DB_PASS=postgres

# ============================================
# Menu Service (Future)
# ============================================
MENU_PORT=3003
MENU_DB_HOST=localhost
MENU_DB_NAME=menu_db
# ... và cứ thế cho các services khác
```

**Cách mỗi service đọc config:**

```typescript
// apps/auth-service/src/app.module.ts
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    host: config.get<string>('AUTH_DB_HOST', 'localhost'),
    database: config.get<string>('AUTH_DB_NAME', 'auth_db'),
    // Hoặc fallback về DB_HOST nếu không có prefix (backward compatible)
    host: config.get<string>('AUTH_DB_HOST') || config.get<string>('DB_HOST', 'localhost'),
  }),
})

// apps/order-service/src/app.module.ts (future)
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    host: config.get<string>('ORDER_DB_HOST', 'localhost'),
    database: config.get<string>('ORDER_DB_NAME', 'order_db'),
  }),
})
```

#### 📝 **Tóm tắt nhanh**

| Câu hỏi | Trả lời |
|---------|---------|
| **Tạo `.env` ở đâu?** | ✅ **Ở ROOT của project** (cùng cấp với `package.json`) |
| **Có cần `.env` trong từng service không?** | ❌ **KHÔNG cần** - Tất cả đọc từ root `.env` |
| **Với nhiều services thì sao?** | ✅ **Vẫn chỉ 1 file `.env` ở root**, dùng **SERVICE_PREFIX** (ví dụ: `AUTH_DB_HOST`, `ORDER_DB_HOST`) |
| **File nào cần tạo?** | ✅ Chỉ cần `.env` ở root (copy từ `.env.example`) |
| **Docker có cần `.env` không?** | ⚠️ **Không bắt buộc** - Docker Compose set env vars trực tiếp |
| **Nội dung `.env` như thế nào?** | ✅ Xem file `.env.example` ở root |

#### 📝 Best Practices

1. **✅ Tạo `.env` ở ROOT** - Copy từ `.env.example`
2. **❌ KHÔNG tạo `.env` trong từng service** - Không cần thiết, tất cả đọc từ root
3. **✅ Dùng SERVICE_PREFIX** - Khi có nhiều services, dùng prefix (`AUTH_DB_HOST`, `ORDER_DB_HOST`) để tránh conflict
4. **✅ Shared configs không cần prefix** - `REDIS_HOST`, `JWT_SECRET` dùng chung
5. **✅ `.env.local` (optional)** - Cho local overrides ở root (gitignored)
6. **✅ Never commit `.env`** - Đã có trong `.gitignore`
7. **✅ Use `.env.example`** - Template để team biết cần config gì

#### 🎯 **Kết luận: Với nhiều services**

**Câu trả lời:** ✅ **Vẫn chỉ cần 1 file `.env` ở ROOT**

- **Không cần** tạo nhiều file `.env` trong từng service
- **Dùng SERVICE_PREFIX** (`AUTH_*`, `ORDER_*`, `MENU_*`) để phân biệt
- **Shared configs** (`REDIS_HOST`, `JWT_SECRET`) không cần prefix
- **Mỗi service** đọc config của mình từ cùng 1 file `.env` ở root

**Ví dụ:**
- 2 services → 1 file `.env` ở root ✅
- 8 services → Vẫn chỉ 1 file `.env` ở root ✅
- 20 services → Vẫn chỉ 1 file `.env` ở root ✅

### Running with Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Gateway, Auth Service)
pnpm run docker:up

# View logs
pnpm run docker:logs

# Stop all services
pnpm run docker:down

# Restart services
pnpm run docker:down && pnpm run docker:up
```

### Running Locally (Development)

```bash
# Terminal 1: Start infrastructure services
docker-compose up -d postgres-auth redis

# Terminal 2: Start API Gateway
pnpm run start:dev:gateway

# Terminal 3: Start Auth Service
pnpm run start:dev:auth
```

### Verify Services

```bash
# Check API Gateway
curl http://localhost:3000/api/v1/auth/register

# Check Auth Service directly
curl http://localhost:3001/auth/register

# Check PostgreSQL
docker exec -it postgres-auth psql -U postgres -d auth_db

# Check Redis
docker exec -it redis redis-cli ping
```

---

## 🔍 Service Details

### 1️⃣ API Gateway Service

**Port:** `3000`  
**Purpose:** Single entry point for all client requests

#### Responsibilities

- **Request Routing:** Forwards requests to appropriate microservices
- **Authentication Proxy:** Validates JWT tokens before routing
- **Socket.IO Hub:** Manages real-time WebSocket connections
- **CORS Handling:** Configures cross-origin resource sharing
- **Request/Response Transformation:** Standardizes API responses

#### Features

- ✅ Routes `/api/v1/auth/*` → Auth Service
- ✅ Socket.IO gateway for real-time events
- ✅ CORS enabled for frontend integration
- ✅ Global API prefix: `/api/v1`
- ✅ Request validation and error handling

#### Architecture

```
GatewayController
  ├── proxyAuth() → GatewayService → Auth Service
  └── Socket.IO Events → AppGateway
```

#### Configuration

- **Global Prefix:** `/api/v1`
- **CORS:** Enabled for all origins (development)
- **Validation:** Global validation pipes enabled

---

### 2️⃣ Auth Service

**Port:** `3001`  
**Purpose:** User authentication and authorization

#### Responsibilities

- **User Management:** Registration, login, profile management
- **JWT Token Management:** Access token and refresh token issuance
- **Role-Based Access Control:** Admin, Staff, Kitchen roles
- **Password Security:** Bcrypt hashing
- **Event Publishing:** Publishes user events to Redis

#### Features

- ✅ User registration with role assignment
- ✅ Secure login with JWT tokens
- ✅ Token refresh mechanism
- ✅ Profile management
- ✅ Admin user listing
- ✅ Role-based guards and decorators
- ✅ Redis event publishing (`user.created`, `user.updated`)

#### Database

- **Database:** `auth_db` (PostgreSQL)
- **Tables:** `users`, `refresh_tokens`
- **ORM:** TypeORM with auto-synchronization (dev mode)

#### Security

- **Password Hashing:** Bcrypt with salt rounds (10)
- **JWT Tokens:**
  - Access token: 1 hour expiry
  - Refresh token: 7 days expiry, stored in database
- **Role Guards:** Protects admin-only endpoints

#### Architecture

```
AuthController
  ├── register() → AuthService → UserRepository
  ├── login() → AuthService → JWTService
  ├── refresh() → AuthService → RefreshTokenRepository
  ├── getProfile() → AuthService (JwtAuthGuard)
  └── getAllUsers() → AuthService (JwtAuthGuard + RolesGuard)
```

---

## 📡 API Documentation

### Base URLs

- **API Gateway:** `http://localhost:3000/api/v1`
- **Auth Service (Direct):** `http://localhost:3001`

### Authentication Endpoints

All endpoints are accessible through the API Gateway at `/api/v1/auth/*`

#### 1. Register User

**Endpoint:** `POST /api/v1/auth/register`  
**Description:** Create a new user account

**Request Body:**

```json
{
  "username": "staff1",
  "password": "password123",
  "fullName": "John Doe",
  "role": "staff" // Optional: "admin" | "staff" | "kitchen", defaults to "staff"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "username": "staff1",
    "fullName": "John Doe",
    "role": "staff",
    "isActive": true,
    "createdAt": "2025-01-XX...",
    "updatedAt": "2025-01-XX..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "password": "admin123",
    "fullName": "Admin User",
    "role": "admin"
  }'
```

---

#### 2. Login

**Endpoint:** `POST /api/v1/auth/login`  
**Description:** Authenticate user and receive JWT tokens

**Request Body:**

```json
{
  "username": "staff1",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "username": "staff1",
    "fullName": "John Doe",
    "role": "staff",
    "isActive": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff1",
    "password": "password123"
  }'
```

---

#### 3. Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`  
**Description:** Get new access token using refresh token

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

---

#### 4. Get Profile

**Endpoint:** `GET /api/v1/auth/profile`  
**Description:** Get current authenticated user's profile  
**Authentication:** Required (Bearer Token)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": "uuid",
  "username": "staff1",
  "fullName": "John Doe",
  "role": "staff",
  "isActive": true,
  "createdAt": "2025-01-XX...",
  "updatedAt": "2025-01-XX..."
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer your-access-token-here"
```

---

#### 5. Logout

**Endpoint:** `POST /api/v1/auth/logout`  
**Description:** Logout user and invalidate refresh token(s)  
**Authentication:** Required (Bearer Token)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body (Optional):**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Note:** 
- If `refreshToken` is provided, only that specific token will be invalidated (logout from one device)
- If `refreshToken` is not provided, all refresh tokens for the user will be invalidated (logout from all devices)

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Example:**

```bash
# Logout from all devices
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer your-access-token-here"

# Logout from specific device
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer your-access-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

---

#### 6. List All Users (Admin Only)

**Endpoint:** `GET /api/v1/auth/users`  
**Description:** Get list of all users (Admin role required)  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin role required

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  {
    "id": "uuid",
    "username": "admin1",
    "fullName": "Admin User",
    "role": "admin",
    "isActive": true,
    "createdAt": "2025-01-XX...",
    "updatedAt": "2025-01-XX..."
  },
  {
    "id": "uuid",
    "username": "staff1",
    "fullName": "John Doe",
    "role": "staff",
    "isActive": true,
    "createdAt": "2025-01-XX...",
    "updatedAt": "2025-01-XX..."
  }
]
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/v1/auth/users \
  -H "Authorization: Bearer admin-access-token-here"
```

---

## 🔌 Socket.IO Events

The Gateway Service exposes Socket.IO for real-time updates. Connect to `http://localhost:3000`

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

### Available Events

#### 1. `order:new`

**Emitted:** When a new order is placed  
**Payload:**

```typescript
{
  orderId: string;
  tableId?: string;
  items?: unknown[];
  status?: string;
  [key: string]: unknown;
}
```

**Example:**

```javascript
socket.on('order:new', (payload) => {
  console.log('New order:', payload);
});
```

#### 2. `order:update`

**Emitted:** When order status changes  
**Payload:** Same as `order:new`

**Example:**

```javascript
socket.on('order:update', (payload) => {
  console.log('Order updated:', payload);
});
```

#### 3. `bill:paid`

**Emitted:** When a bill is paid  
**Payload:**

```typescript
{
  billId: string;
  orderId: string;
  amount: number;
  status?: string;
  [key: string]: unknown;
}
```

**Example:**

```javascript
socket.on('bill:paid', (payload) => {
  console.log('Bill paid:', payload);
});
```

### Sending Events

```javascript
// Send order:new event
socket.emit('order:new', {
  orderId: 'order-123',
  tableId: 'table-5',
  items: [{ dishId: 'dish-1', quantity: 2 }],
});
```

---

## 🛠️ Development

### Project Structure

```
restaurant-microservices/
├── apps/
│   ├── api-gateway/          # API Gateway Service
│   │   ├── src/
│   │   │   ├── gateway/      # Gateway controllers, services, Socket.IO
│   │   │   └── main.ts
│   │   └── Dockerfile
│   └── auth-service/         # Authentication Service
│       ├── src/
│       │   ├── auth/         # Auth module (controllers, services, entities)
│       │   ├── config/       # Database, Redis configs
│       │   └── main.ts
│       └── Dockerfile
├── libs/                     # Shared libraries
├── docs/                     # Documentation
├── docker-compose.yml        # Docker services configuration
└── package.json
```

### Available Scripts

```bash
# Development
pnpm run start:dev:gateway    # Start API Gateway in watch mode
pnpm run start:dev:auth       # Start Auth Service in watch mode

# Docker
pnpm run docker:up            # Start all services
pnpm run docker:down          # Stop all services
pnpm run docker:logs          # View logs

# Code Quality
pnpm run format               # Format code with Prettier
pnpm run lint                 # Lint code with ESLint
pnpm run test                 # Run tests
pnpm run build                # Build for production
```

### Testing APIs

#### Using cURL

```bash
# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

#### Using Postman/Insomnia

1. Import the endpoints from the API documentation above
2. Set base URL: `http://localhost:3000/api/v1`
3. For authenticated endpoints, add header:
   ```
   Authorization: Bearer <your-access-token>
   ```

---

## 🗄️ Database Schema

### Auth Service (`auth_db`)

#### Table: `users`

| Field           | Type      | Constraints               | Description                            |
| --------------- | --------- | ------------------------- | -------------------------------------- |
| `id`            | UUID      | PRIMARY KEY               | User unique identifier                 |
| `username`      | VARCHAR   | UNIQUE, NOT NULL          | Login username                         |
| `password_hash` | VARCHAR   | NOT NULL                  | Bcrypt hashed password                 |
| `full_name`     | VARCHAR   | NOT NULL                  | User's full name                       |
| `role`          | ENUM      | NOT NULL, DEFAULT 'staff' | User role: 'admin', 'staff', 'kitchen' |
| `is_active`     | BOOLEAN   | NOT NULL, DEFAULT true    | Account active status                  |
| `created_at`    | TIMESTAMP | NOT NULL                  | Account creation time                  |
| `updated_at`    | TIMESTAMP | NOT NULL                  | Last update time                       |

#### Table: `refresh_tokens`

| Field        | Type      | Constraints            | Description             |
| ------------ | --------- | ---------------------- | ----------------------- |
| `id`         | UUID      | PRIMARY KEY            | Token unique identifier |
| `user_id`    | UUID      | FOREIGN KEY → users.id | Reference to user       |
| `token`      | TEXT      | NOT NULL, UNIQUE       | JWT refresh token       |
| `expires_at` | TIMESTAMP | NOT NULL               | Token expiration time   |
| `created_at` | TIMESTAMP | NOT NULL               | Token creation time     |

**Relations:**

- `refresh_tokens.user_id` → `users.id` (CASCADE DELETE)

---

## 🔐 Authentication

### JWT Token Flow

1. **Login/Register** → Receive `accessToken` and `refreshToken`
2. **API Requests** → Include `accessToken` in `Authorization` header
3. **Token Expiry** → Use `refreshToken` to get new `accessToken`
4. **Logout** → Client discards tokens (server-side refresh tokens remain until expiry)

### Token Structure

**Access Token Payload:**

```json
{
  "sub": "user-uuid",
  "username": "staff1",
  "role": "staff",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Refresh Token Payload:**

```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Role-Based Access Control

- **Admin:** Full access, can list all users
- **Staff:** Can manage orders, tables, menu
- **Kitchen:** Can view and update order status

### Security Features

- ✅ Password hashing with Bcrypt (10 salt rounds)
- ✅ JWT token expiration (1 hour access, 7 days refresh)
- ✅ Refresh tokens stored in database
- ✅ Role-based guards and decorators
- ✅ CORS configuration
- ✅ Input validation with class-validator

---

## 📚 Additional Documentation

- [Project Brief](./docs/project_brief.md) - Detailed project overview and architecture
- [Microservices Setup](./docs/project_microservices_setup.md) - Setup guide and next steps

---

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use**

**Error:** `bind: address already in use` khi chạy `docker-compose up`

```bash
# Check what's using the port
lsof -i :3000  # API Gateway
lsof -i :3001  # Auth Service
lsof -i :5432  # PostgreSQL (if you have local PostgreSQL running)

# Kill the process or change port in .env
```

**⚠️ PostgreSQL Port Conflict:**

Nếu bạn đã có PostgreSQL local chạy trên port `5432`, Docker Compose sẽ tự động map PostgreSQL container sang port `5433` trên host để tránh conflict.

- **Docker container:** PostgreSQL chạy trên port `5432` (bên trong container)
- **Host machine:** PostgreSQL accessible qua port `5433` (từ máy local)

**Kết nối từ máy local (DBeaver, psql, etc.):**
```bash
# Sử dụng port 5433 thay vì 5432
psql -h localhost -p 5433 -U postgres -d auth_db

# Hoặc trong DBeaver/connection string:
# Host: localhost
# Port: 5433
# Database: auth_db
# User: postgres
# Password: postgres
```

**Lưu ý:** Các services trong Docker network vẫn kết nối với nhau qua port `5432` (không cần thay đổi).

**2. Database connection failed**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres-auth

# Check logs
docker logs postgres-auth

# Restart PostgreSQL
docker-compose restart postgres-auth

# Test connection from host (use port 5433 if local PostgreSQL is running)
psql -h localhost -p 5433 -U postgres -d auth_db
```

**3. Redis connection failed**

```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it redis redis-cli ping
```

**4. JWT token invalid**

- Check if `JWT_SECRET` matches between services
- Verify token hasn't expired
- Ensure `Authorization: Bearer <token>` header format is correct

---

## 📝 License

MIT

---

## 👥 Contributing

This is version 1.0 of the Restaurant Ordering System. Future versions will include:

- Table Service
- Menu Service
- Order Service
- Kitchen Service
- Billing Service
- Reporting Service

---

**Version:** 1.0  
**Last Updated:** 2025-01-XX
