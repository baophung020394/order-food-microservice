# 📚 API Endpoints Documentation

Tổng hợp đầy đủ các API endpoints của **Food Service** và **Order Service**.

**Base URL:** `http://localhost:3000/api/v1` (qua API Gateway)

---

## 🍜 Food Service APIs

### **Category Endpoints**

#### 1. **POST** `/food/categories` - Tạo category mới

**Request Body:**
```json
{
  "name": "Món Chính",                    // Required: string
  "description": "Các món ăn chính",      // Optional: string
  "imageUrl": "https://...",              // Optional: string
  "displayOrder": 1,                       // Optional: number (min: 0)
  "isActive": true                         // Optional: boolean
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Món Chính",
  "description": "Các món ăn chính",
  "imageUrl": "https://...",
  "displayOrder": 1,
  "isActive": true,
  "dishes": [],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

#### 2. **GET** `/food/categories` - Lấy danh sách categories

**Query Parameters:**
- `isActive` (optional): `boolean` - Filter theo trạng thái active
- `page` (optional): `number` - Số trang (default: 1)
- `limit` (optional): `number` - Số items mỗi trang (default: 10)

**Example:**
```
GET /food/categories?isActive=true&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Món Chính",
      "description": "...",
      "imageUrl": "...",
      "displayOrder": 1,
      "isActive": true,
      "dishes": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

#### 3. **GET** `/food/categories/:id` - Lấy category theo ID

**Path Parameters:**
- `id`: `string` (UUID)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Món Chính",
  "description": "...",
  "imageUrl": "...",
  "displayOrder": 1,
  "isActive": true,
  "dishes": [...],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### 4. **PUT** `/food/categories/:id` - Cập nhật category

**Path Parameters:**
- `id`: `string` (UUID)

**Request Body:** (Tất cả fields đều optional)
```json
{
  "name": "Món Chính Mới",        // Optional: string
  "description": "...",            // Optional: string
  "imageUrl": "...",               // Optional: string
  "displayOrder": 2,               // Optional: number (min: 0)
  "isActive": false                // Optional: boolean
}
```

**Response:** `200 OK` - Category object đã được cập nhật

---

#### 5. **DELETE** `/food/categories/:id` - Xóa category

**Path Parameters:**
- `id`: `string` (UUID)

**Response:** `204 No Content`

**Lưu ý:** Không thể xóa category nếu còn dishes trong category đó.

---

### **Dish Endpoints**

#### 6. **POST** `/food/dishes` - Tạo dish mới

**Request Body:**
```json
{
  "name": "Phở Bò",                        // Required: string
  "description": "Phở bò truyền thống",   // Optional: string
  "categoryId": "uuid",                   // Required: string (UUID)
  "price": 50000,                         // Required: number (min: 0)
  "imageUrl": "https://...",              // Optional: string
  "status": "available",                  // Optional: enum ("available" | "out_of_stock" | "discontinued")
  "preparationTime": 15,                  // Optional: number (minutes, min: 0)
  "spiceLevel": 2,                        // Optional: number (0-5)
  "isVegetarian": false,                  // Optional: boolean
  "isVegan": false,                       // Optional: boolean
  "isGlutenFree": false,                  // Optional: boolean
  "calories": 350,                        // Optional: number (min: 0)
  "displayOrder": 0                       // Optional: number (min: 0)
}
```

**Response:** `201 Created` - Dish object

---

#### 7. **GET** `/food/dishes` - Lấy danh sách dishes

**Query Parameters:**
- `status` (optional): `enum` - `"available" | "out_of_stock" | "discontinued"`
- `categoryId` (optional): `string` (UUID) - Filter theo category
- `isVegetarian` (optional): `boolean`
- `isVegan` (optional): `boolean`
- `isGlutenFree` (optional): `boolean`
- `search` (optional): `string` - Tìm kiếm theo tên hoặc mô tả
- `page` (optional): `number` - Số trang (default: 1)
- `limit` (optional): `number` - Số items mỗi trang (default: 10)

**Example:**
```
GET /food/dishes?status=available&categoryId=uuid&search=phở&isVegetarian=false&page=1&limit=10
```

**Response:** `200 OK` - Paginated response với danh sách dishes

---

#### 8. **GET** `/food/dishes/available` - Lấy danh sách dishes available

**Query Parameters:** (Giống như GET `/food/dishes`, nhưng `status=available` được tự động áp dụng)

**Response:** `200 OK` - Paginated response với dishes có status = "available"

---

#### 9. **GET** `/food/dishes/category/:categoryId` - Lấy dishes theo category

**Path Parameters:**
- `categoryId`: `string` (UUID)

**Query Parameters:** (Giống như GET `/food/dishes`)

**Response:** `200 OK` - Paginated response với dishes của category

---

#### 10. **GET** `/food/dishes/:id` - Lấy dish theo ID

**Path Parameters:**
- `id`: `string` (UUID)

**Response:** `200 OK` - Dish object với thông tin category

---

#### 11. **PUT** `/food/dishes/:id` - Cập nhật dish

**Path Parameters:**
- `id`: `string` (UUID)

**Request Body:** (Tất cả fields đều optional)
```json
{
  "name": "Phở Bò Đặc Biệt",      // Optional: string
  "description": "...",            // Optional: string
  "categoryId": "uuid",            // Optional: string (UUID)
  "price": 60000,                  // Optional: number (min: 0)
  "imageUrl": "...",               // Optional: string
  "status": "out_of_stock",        // Optional: enum
  "preparationTime": 20,           // Optional: number
  "spiceLevel": 3,                 // Optional: number (0-5)
  "isVegetarian": false,           // Optional: boolean
  "isVegan": false,                // Optional: boolean
  "isGlutenFree": false,           // Optional: boolean
  "calories": 400,                 // Optional: number
  "displayOrder": 1                // Optional: number
}
```

**Response:** `200 OK` - Dish object đã được cập nhật

---

#### 12. **PATCH** `/food/dishes/:id/status` - Cập nhật status của dish

**Path Parameters:**
- `id`: `string` (UUID)

**Request Body:**
```json
{
  "status": "out_of_stock"  // Required: enum ("available" | "out_of_stock" | "discontinued")
}
```

**Response:** `200 OK` - Dish object với status mới

---

#### 13. **DELETE** `/food/dishes/:id` - Xóa dish

**Path Parameters:**
- `id`: `string` (UUID)

**Response:** `204 No Content`

---

## 🛒 Order Service APIs

### **Order Endpoints**

#### 1. **POST** `/orders` - Tạo order mới

**Request Body:**
```json
{
  "tableId": "uuid",                    // Required: string (UUID)
  "items": [                             // Required: array (ít nhất 1 item)
    {
      "dishId": "uuid",                  // Required: string (UUID)
      "dishName": "Phở Bò",              // Required: string
      "quantity": 2,                     // Required: number (min: 1)
      "price": 50000,                    // Required: number (min: 0)
      "notes": "Không hành"              // Optional: string
    }
  ],
  "notes": "Giao hàng nhanh",            // Optional: string
  "createdBy": "user-uuid"               // Optional: string (User ID)
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "tableId": "uuid",
  "status": "pending",
  "totalAmount": 100000,
  "notes": "Giao hàng nhanh",
  "createdBy": "user-uuid",
  "items": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "dishId": "uuid",
      "dishName": "Phở Bò",
      "quantity": 2,
      "price": 50000,
      "notes": "Không hành",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Lưu ý:** `totalAmount` được tự động tính từ tổng của `items[].price * items[].quantity`

---

#### 2. **GET** `/orders` - Lấy danh sách orders

**Query Parameters:**
- `status` (optional): `enum` - `"pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"`
- `tableId` (optional): `string` - Filter theo table
- `createdBy` (optional): `string` - Filter theo user
- `page` (optional): `number` - Số trang (default: 1)
- `limit` (optional): `number` - Số items mỗi trang (default: 10)

**Example:**
```
GET /orders?status=pending&tableId=uuid&page=1&limit=10
```

**Response:** `200 OK` - Paginated response với danh sách orders

---

#### 3. **GET** `/orders/table/:tableId` - Lấy orders theo table ID

**Path Parameters:**
- `tableId`: `string` (UUID)

**Response:** `200 OK` - Array of orders cho table đó

---

#### 4. **GET** `/orders/table/:tableId/active` - Lấy active orders của table

**Path Parameters:**
- `tableId`: `string` (UUID)

**Response:** `200 OK` - Array of orders có status != "completed" và != "cancelled"

---

#### 5. **GET** `/orders/:id` - Lấy order theo ID

**Path Parameters:**
- `id`: `string` (UUID)

**Response:** `200 OK` - Order object với đầy đủ items

---

#### 6. **PUT** `/orders/:id` - Cập nhật order

**Path Parameters:**
- `id`: `string` (UUID)

**Request Body:** (Tất cả fields đều optional)
```json
{
  "status": "confirmed",                 // Optional: enum
  "notes": "Ghi chú mới",               // Optional: string
  "items": [                             // Optional: array (để thêm/cập nhật items)
    {
      "dishId": "uuid",
      "dishName": "Phở Bò",
      "quantity": 3,
      "price": 50000,
      "notes": "..."
    }
  ]
}
```

**Response:** `200 OK` - Order object đã được cập nhật

**Lưu ý:** `totalAmount` sẽ được tự động tính lại khi items thay đổi

---

#### 7. **PATCH** `/orders/:id/status` - Cập nhật status của order

**Path Parameters:**
- `id`: `string` (UUID)

**Request Body:**
```json
{
  "status": "confirmed"  // Required: enum ("pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled")
}
```

**Response:** `200 OK` - Order object với status mới

**Status Transitions:**
- `pending` → `confirmed` → `preparing` → `ready` → `completed`
- Bất kỳ status nào → `cancelled` (trừ `completed`)

---

#### 8. **DELETE** `/orders/:id` - Xóa order

**Path Parameters:**
- `id`: `string` (UUID)

**Response:** `204 No Content`

**Lưu ý:** Xóa order sẽ xóa tất cả order items liên quan

---

### **Order Item Endpoints**

#### 9. **POST** `/orders/:orderId/items` - Thêm item vào order

**Path Parameters:**
- `orderId`: `string` (UUID)

**Request Body:**
```json
{
  "dishId": "uuid",                  // Required: string (UUID)
  "dishName": "Phở Bò",              // Required: string
  "quantity": 1,                     // Required: number (min: 1)
  "price": 50000,                    // Required: number (min: 0)
  "notes": "Không hành"              // Optional: string
}
```

**Response:** `201 Created` - OrderItem object

**Lưu ý:** `totalAmount` của order sẽ được tự động cập nhật

---

#### 10. **PUT** `/orders/:orderId/items/:itemId` - Cập nhật order item

**Path Parameters:**
- `orderId`: `string` (UUID)
- `itemId`: `string` (UUID)

**Request Body:** (Tất cả fields đều optional)
```json
{
  "quantity": 3,                     // Optional: number (min: 1)
  "price": 60000,                    // Optional: number (min: 0)
  "notes": "Ghi chú mới"            // Optional: string
}
```

**Response:** `200 OK` - OrderItem object đã được cập nhật

**Lưu ý:** `totalAmount` của order sẽ được tự động cập nhật

---

#### 11. **DELETE** `/orders/:orderId/items/:itemId` - Xóa item khỏi order

**Path Parameters:**
- `orderId`: `string` (UUID)
- `itemId`: `string` (UUID)

**Response:** `204 No Content`

**Lưu ý:** `totalAmount` của order sẽ được tự động cập nhật

---

## 📊 Enums Reference

### **DishStatus**
```typescript
enum DishStatus {
  AVAILABLE = "available",
  OUT_OF_STOCK = "out_of_stock",
  DISCONTINUED = "discontinued"
}
```

### **OrderStatus**
```typescript
enum OrderStatus {
  PENDING = "pending",        // Order created but not confirmed
  CONFIRMED = "confirmed",   // Order confirmed, sent to kitchen
  PREPARING = "preparing",   // Kitchen is preparing
  READY = "ready",           // Order ready for serving
  COMPLETED = "completed",   // Order completed and served
  CANCELLED = "cancelled"    // Order cancelled
}
```

---

## 🔐 Authentication

Tất cả các endpoints đều có thể được bảo vệ bằng JWT token (tùy theo cấu hình API Gateway).

**Header:**
```
Authorization: Bearer <jwt_token>
```

---

## 📝 Notes

1. **Pagination:** Tất cả GET endpoints trả về danh sách đều hỗ trợ pagination với `page` và `limit`
2. **Validation:** Tất cả request body đều được validate tự động
3. **Error Handling:** 
   - `400 Bad Request` - Validation errors
   - `404 Not Found` - Resource không tồn tại
   - `409 Conflict` - Conflict (ví dụ: category name đã tồn tại)
   - `500 Internal Server Error` - Server errors
4. **Auto Calculation:** `totalAmount` trong Order được tự động tính từ items
5. **Status Transitions:** Order status có validation để đảm bảo transitions hợp lệ

---

**Last Updated:** 2025-01-27

