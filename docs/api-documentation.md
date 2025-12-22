# API Documentation Guide

This document explains how to access and use the Swagger documentation for the Omade Cravings API.

## Accessing the Documentation

### Development Environment
When running the development server:
```bash
npm run dev
```

Visit: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Production Environment
When the API is deployed to production, visit:
```
https://your-production-domain.com/api/docs
```

## Features

### Interactive Documentation
The Swagger UI provides:

- **Complete API Reference**: All endpoints with request/response schemas
- **Interactive Testing**: Try API calls directly from the documentation
- **Authentication Support**: Test protected endpoints with JWT tokens
- **Guest Session Support**: Test cart operations with guest sessions
- **Real-time Validation**: See request/response validation in action

### Key Documentation Sections

#### 1. Authentication Endpoints (`/api/v1/auth`)
- User registration and login
- JWT token management
- Password reset functionality
- User profile management

#### 2. Product Management (`/api/v1/products`)
- Browse products with filtering and pagination
- Category and subcategory listings
- Product search functionality
- Admin product management (requires authentication)

#### 3. Enhanced Cart System (`/api/v2/cart`)
- Guest session management
- Add/update/remove cart items
- Custom cake configuration
- Cart validation and checkout preparation
- Merge guest cart with user account

#### 4. Order Management (`/api/v1/orders`)
- Order creation and tracking
- Order history
- Status updates

#### 5. Additional Features
- Reviews and ratings
- Loyalty points system
- Promotional codes
- Custom cake ordering
- Notifications

## Authentication Methods

### 1. JWT Bearer Authentication
For authenticated users:

1. Login via `/api/v1/auth/login`
2. Copy the `accessToken` from response
3. In Swagger UI, click "Authorize" button
4. Enter: `Bearer YOUR_ACCESS_TOKEN`

### 2. Guest Session Authentication
For guest users (cart operations):

1. Create session via `/api/v2/cart/guest/session`
2. Copy the `sessionId` from response
3. Add `x-session-id` header with the session ID

## Testing API Endpoints

### Example 1: User Registration
```json
POST /api/v1/auth/register
{
  "email": "test@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Example 2: Add Item to Cart (Guest)
```bash
# First create guest session
POST /api/v2/cart/guest/session

# Then add item with session ID in header
POST /api/v2/cart/items
Headers: x-session-id: YOUR_SESSION_ID
{
  "productId": "product-uuid",
  "quantity": 2,
  "specialInstructions": "Extra sweet please"
}
```

### Example 3: Custom Cake Order
```json
POST /api/v2/cart/items
{
  "productId": "custom-cake-product-id",
  "quantity": 1,
  "customCakeConfig": {
    "flavor": "Chocolate",
    "size": "8 inch",
    "frosting": "Buttercream",
    "message": "Happy Birthday!",
    "extraDetails": {
      "decorations": ["Fresh Flowers", "Chocolate Drip"],
      "layers": 2
    }
  },
  "specialInstructions": "Please write message in blue frosting"
}
```

## Schema Definitions

The API documentation includes comprehensive schema definitions for:

- **User**: User account information
- **Product**: Product catalog items
- **CartItem**: Shopping cart item structure
- **Order**: Order and order item details
- **Error**: Standard error response format

## Response Formats

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Pagination

List endpoints support pagination:

```
GET /api/v1/products?page=1&limit=20&sortBy=name&sortOrder=asc
```

Response includes pagination metadata:
```json
{
  "data": {
    "products": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Rate Limiting

The API includes rate limiting for security. Limits are documented in each endpoint description.

## Error Codes

Common HTTP status codes used:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., user already exists)
- `500` - Internal Server Error

## Support

For API documentation issues or questions:

1. Check the interactive Swagger UI at `/api/docs`
2. Review this documentation
3. Check the codebase for implementation details
4. Contact the development team

## Development Notes

### Adding New Documentation

When adding new endpoints:

1. Add Swagger JSDoc comments to route files
2. Follow existing patterns for consistency
3. Include comprehensive examples
4. Test documentation with `node test-swagger.js`

### Updating Schemas

Schema definitions are in `/src/config/swagger.ts`. Update them when models change.

### Custom CSS

The Swagger UI includes custom styling to hide the top bar and improve appearance.