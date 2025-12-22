# 🍰 Omade Cravings Bakery Platform - API Documentation

## Base URL
```
Development: http://localhost:3000
Production: https://api.omadecravings.com
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

---

## 🍰 Products API

### GET /api/v1/products
Get all products with optional filtering.

**Query Parameters:**
- `category` (string): Filter by product category
- `search` (string): Search in product name and description
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)

**Example Request:**
```bash
GET /api/v1/products?category=cakes&search=chocolate&page=1&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Chocolate Cake",
        "description": "Rich dark chocolate cake",
        "price": 25.99,
        "category": "cakes",
        "stock": 15,
        "image_url": "https://example.com/chocolate-cake.jpg",
        "is_customizable": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### GET /api/v1/products/:id
Get a specific product by ID.

**Parameters:**
- `id` (UUID): Product ID

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Chocolate Cake",
    "description": "Rich dark chocolate cake",
    "price": 25.99,
    "category": "cakes",
    "stock": 15,
    "image_url": "https://example.com/chocolate-cake.jpg",
    "is_customizable": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST /api/v1/products
Create a new product. **Admin only**

**Request Body:**
```json
{
  "name": "New Cake",
  "description": "Delicious new cake",
  "price": 29.99,
  "category": "cakes",
  "stock": 20,
  "image_url": "https://example.com/new-cake.jpg",
  "is_customizable": false
}
```

**Validation Rules:**
- `name`: Required, min 2 characters
- `price`: Required, positive number
- `stock`: Required, non-negative integer
- `image_url`: Optional, valid URL
- `is_customizable`: Optional, boolean (default: false)

### PATCH /api/v1/products/:id
Update an existing product. **Admin only**

**Request Body:** Same as POST, all fields optional

### DELETE /api/v1/products/:id
Delete a product. **Admin only**

---

## 🛒 Cart API

**Note:** All cart endpoints require authentication.

### GET /api/v1/cart
Get user's current cart.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "items": [
      {
        "product_id": "product-uuid",
        "quantity": 2,
        "unit_price": 25.99,
        "subtotal": 51.98
      }
    ],
    "total_amount": 51.98,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### POST /api/v1/cart/items
Add item to cart.

**Request Body:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 2
}
```

### PATCH /api/v1/cart/items/:productId
Update item quantity in cart.

**Request Body:**
```json
{
  "quantity": 3
}
```

**Note:** Setting quantity to 0 removes the item.

### DELETE /api/v1/cart/items/:productId
Remove item from cart.

---

## ⭐ Reviews API

### POST /api/v1/reviews
Create a product review. **Requires authentication**

**Request Body:**
```json
{
  "product_id": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 5,
  "comment": "Amazing cake! Highly recommend."
}
```

**Validation Rules:**
- `product_id`: Required, valid UUID
- `rating`: Required, integer 1-5
- `comment`: Optional, max 1000 characters

### GET /api/v1/reviews/product/:id
Get reviews for a specific product.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Amazing cake!",
        "createdAt": "2024-01-15T10:30:00Z",
        "user": {
          "id": "user-uuid",
          "name": "John Doe"
        }
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### GET /api/v1/reviews/my
Get current user's reviews. **Requires authentication**

### DELETE /api/v1/reviews/:reviewId
Delete own review. **Requires authentication**

---

## 🏆 Loyalty Points API

### GET /api/v1/loyalty
Get user's loyalty points balance. **Requires authentication**

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "loyalty-uuid",
    "user_id": "user-uuid",
    "points": 250,
    "updatedAt": "2024-01-15T10:30:00Z",
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Points System:**
- Earn 1 point per $1 spent
- 100 points = $1 reward value

---

## 🎟️ Promo Codes API

### GET /api/v1/promo/validate
Validate a promo code.

**Query Parameters:**
- `code` (string): Promo code to validate

**Request Body:**
```json
{
  "order_amount": 50.00
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "promo": {
      "id": "promo-uuid",
      "code": "SAVE10",
      "discount_type": "percent",
      "amount": 10
    },
    "discount_amount": 5.00
  }
}
```

### POST /api/v1/promo
Create new promo code. **Admin only**

**Request Body:**
```json
{
  "code": "SUMMER20",
  "discount_type": "percent",
  "amount": 20,
  "valid_from": "2024-06-01T00:00:00Z",
  "valid_to": "2024-08-31T23:59:59Z",
  "usage_limit": 1000
}
```

**Discount Types:**
- `percent`: Percentage discount (amount represents percentage)
- `fixed`: Fixed amount discount (amount represents dollar value)

### GET /api/v1/promo
Get all promo codes. **Admin only**

### GET /api/v1/promo/active
Get currently active promo codes. **Admin only**

### DELETE /api/v1/promo/:id
Delete promo code. **Admin only**

---

## 📦 Orders API

**Note:** Not yet implemented. Coming soon!

### POST /api/v1/orders
Create new order from cart.

### GET /api/v1/orders
Get user's orders.

### GET /api/v1/orders/:id
Get specific order details.

### PATCH /api/v1/orders/:id/status
Update order status. **Staff/Admin only**

---

## 🚚 Delivery API

**Note:** Not yet implemented. Coming soon!

### GET /api/v1/delivery/schedules
Get available delivery schedules.

### POST /api/v1/delivery/schedules
Create delivery schedule. **Staff/Admin only**

---

## 🎂 Custom Cakes API

**Note:** Not yet implemented. Coming soon!

### POST /api/v1/custom-cakes/preview
Preview custom cake configuration.

### POST /api/v1/custom-cakes/upload
Upload custom cake image.

---

## 🔐 Authentication

**Note:** Not yet implemented. Authentication middleware will be added to secure endpoints.

Expected authentication flow:
- JWT-based authentication
- Refresh token support
- Social login (Google, Apple, Facebook)
- Role-based access control

---

## 📊 Error Codes

| HTTP Status | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 🔄 Rate Limiting

- **Default:** 100 requests per 15 minutes per IP
- **Authenticated users:** Higher limits apply
- **Premium users:** Unlimited requests

---

## 📝 Request/Response Examples

### Successful Product Creation
**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Red Velvet Cake",
    "description": "Classic red velvet with cream cheese frosting",
    "price": 28.99,
    "category": "cakes",
    "stock": 10,
    "is_customizable": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-product-uuid",
    "name": "Red Velvet Cake",
    "description": "Classic red velvet with cream cheese frosting",
    "price": 28.99,
    "category": "cakes",
    "stock": 10,
    "image_url": null,
    "is_customizable": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Validation Error
**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "price": -5
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Name must be at least 2 characters",
    "Price must be positive",
    "Stock is required"
  ]
}
```

---

## 🧪 Testing the API

Use the provided test suite:
```bash
npm test
```

Or test individual endpoints:
```bash
# Test health check
curl http://localhost:3000/health

# Test products listing
curl http://localhost:3000/api/v1/products

# Test with filters
curl "http://localhost:3000/api/v1/products?category=cakes&limit=5"
```

---

## 📚 Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Database Schema](./DATABASE.md)
- [Testing Guide](../tests/README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)