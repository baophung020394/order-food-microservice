# 🍽️ Restaurant Ordering App — Microservices Setup

## 🧩 Project Overview

This project implements a **Restaurant Ordering System** designed for internal restaurant use — staff can take customer orders per table, send them to the kitchen, and process payments efficiently.

The architecture follows **microservice design principles** with independent services communicating via **HTTP (REST)** and **Event Streams (Kafka/RabbitMQ/Redis Streams)**.

---

## ⚙️ Tech Stack

| Layer | Technology | Notes |
|--------|-------------|-------|
| **Frontend (Mobile)** | **React Native** | Cross-platform mobile app for staff and kitchen use |
| **Backend Framework** | **NestJS** | Node.js framework for scalable microservices |
| **Database** | **PostgreSQL** | Each microservice has its own DB schema |
| **Message Broker** | **Kafka / RabbitMQ / Redis Streams** | For async communication (use free option in dev) |
| **Realtime** | **Socket.IO** | For live order status and kitchen updates |
| **Containerization** | Docker + Docker Compose | Each service runs independently |
| **API Gateway** | NestJS Gateway Service | Entry point for all clients |
| **Authentication** | JWT (JSON Web Token) | Auth via Auth Service |
| **Deployment (future)** | Kubernetes / Docker Compose | Scalable architecture |

---

## 🏗️ Microservices Overview

| Service | Purpose | Database |
|----------|----------|-----------|
| **Gateway Service** | API gateway, routing, authentication proxy, socket entry point | N/A |
| **Auth Service** | User management, login, token issuing | `auth_db` |
| **Table Service** | Manage restaurant tables and QR codes | `table_db` |
| **Menu Service** | Manage dishes, categories, and availability | `menu_db` |
| **Order Service** | Handle order creation, updates, linking items | `order_db` |
| **Kitchen Service** | Manage preparation status, kitchen display | `kitchen_db` |
| **Billing Service** | Generate bills, calculate totals, handle payments | `billing_db` |
| **Reporting Service** | Aggregated analytics (sales, best-sellers) | `reporting_db` |
| **Notification Service (optional)** | Send socket/push notifications | `notification_db` |

---

## 🧠 Microservice Interactions

- Services communicate via:
  - **HTTP/REST** for synchronous queries
  - **Kafka/RabbitMQ/Redis Streams** for asynchronous event-driven updates (e.g. `order.created`, `order.updated`, `bill.completed`)
  - **Socket.IO** for real-time frontend updates

Example Event Flow:

Staff creates new order → Order Service emits "order.created" →
Kitchen Service consumes → updates item status →
Billing Service later consumes "order.completed" → generates bill.

---

## 🚀 Initial Microservices

### 1️⃣ Auth Service

**Purpose:**  
Handles user registration, login, role management, and token issuance.

**Database:** `auth_db`

#### Tables

##### `users`
| Field | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | User ID |
| `username` | VARCHAR | Unique username |
| `password_hash` | VARCHAR | Hashed password |
| `full_name` | VARCHAR | Display name |
| `role` | ENUM('admin','staff','kitchen') | Access role |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMP | Created time |
| `updated_at` | TIMESTAMP | Updated time |

##### `refresh_tokens`
| Field | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Token ID |
| `user_id` | FK → users.id | Linked user |
| `token` | TEXT | JWT refresh token |
| `expires_at` | TIMESTAMP | Expiry date |

#### APIs
| Method | Endpoint | Description |
|---------|-----------|-------------|
| `POST /auth/register` | Create new user |
| `POST /auth/login` | Authenticate user & issue tokens |
| `POST /auth/refresh` | Refresh access token |
| `GET /auth/profile` | Get current user info |
| `GET /auth/users` | (Admin) List users |

#### Events (Kafka / RabbitMQ / Redis)
| Event | Producer | Consumer | Description |
|--------|-----------|-----------|-------------|
| `user.created` | Auth | All | Notify new account |
| `user.updated` | Auth | All | Notify profile change |

---

### 2️⃣ Gateway Service

**Purpose:**  
Acts as a **reverse proxy + entry point** for all client traffic.  
Handles authentication verification and routes to respective services.

**Responsibilities:**
- Validate JWT tokens before routing
- Forward requests to backend microservices via internal DNS (`auth-service:3001`, `order-service:3002`, etc.)
- Provide unified API base URL for frontend (`/api/v1/...`)
- Manage socket connections for live updates

**Tech Stack:**
- NestJS + `@nestjs/microservices`
- API Gateway Module (custom middleware)
- Socket.IO integration
- Load balancing (future)
- Rate limiting & request logging

#### Example Routing Map

| Route | Forwarded To | Description |
|--------|---------------|-------------|
| `/api/v1/auth/*` | Auth Service | Authentication |
| `/api/v1/tables/*` | Table Service | Manage tables |
| `/api/v1/menu/*` | Menu Service | Dishes |
| `/api/v1/orders/*` | Order Service | Orders |
| `/api/v1/kitchen/*` | Kitchen Service | Kitchen ops |
| `/api/v1/billing/*` | Billing Service | Payments |

---

### ⚙️ Communication & Messaging Setup

#### Message Broker Choice

| Option | Pros | Free Support | Recommended |
|---------|------|--------------|--------------|
| **Kafka** | High throughput, durable | Requires setup | ✅ Best for production |
| **RabbitMQ** | Simpler, supports queues | ✅ Easy to run via Docker | ✅ Best for local dev |
| **Redis Streams** | Built-in pub/sub & lightweight | ✅ Default free option | ⚙️ Use for MVP |

👉 **Recommendation:**  
Use **Redis Streams** or **RabbitMQ** during development (free, minimal setup).  
Later migrate to **Kafka** for scalability.

---

### 🔌 Socket.IO Integration (Realtime Flow)

Realtime communication used for:
- Live order updates in the kitchen dashboard
- Bill updates when payment is processed
- Table status updates (occupied → available)

#### Event Channels

| Channel | Emitted By | Consumed By | Description |
|----------|-------------|-------------|--------------|
| `order:new` | Order Service | Kitchen, Staff | New order placed |
| `order:update` | Kitchen Service | Staff | Status change (preparing → ready) |
| `bill:paid` | Billing Service | Admin Dashboard | Notify completed payment |

---


