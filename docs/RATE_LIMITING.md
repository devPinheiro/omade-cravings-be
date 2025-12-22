# Rate Limiting System

## Overview

The Omade Cravings API implements comprehensive rate limiting to protect against abuse, ensure fair usage, and maintain system stability. The rate limiting system is built with `express-rate-limit` and uses Redis for scalability across multiple server instances.

## Features

- ✅ **Redis-based Storage**: Scalable rate limiting across multiple server instances
- ✅ **Endpoint-specific Limits**: Different limits for different types of operations
- ✅ **User-based Limiting**: Higher limits for authenticated users, lower for guests
- ✅ **Role-based Limiting**: Special limits for admin users
- ✅ **Dynamic Key Generation**: Smart identification of users/guests/IPs
- ✅ **Graceful Degradation**: Falls back to memory store if Redis is unavailable
- ✅ **Standard Headers**: Includes rate limit information in HTTP headers

## Rate Limit Categories

### 1. Authentication Endpoints (`authRateLimit`)
**Limit**: 5 requests per 15 minutes
**Applied to**: Login, register, social auth, refresh token, password reset
**Key Strategy**: IP address or user ID
**Special**: Successful requests don't count for login attempts

```typescript
// Examples of protected endpoints
POST /api/v1/auth/login
POST /api/v1/auth/register 
POST /api/v1/auth/forgot-password
```

### 2. Order Creation (`orderCreationRateLimit`)
**Limit**: 10 orders per hour
**Applied to**: All order creation endpoints
**Key Strategy**: User ID > Guest Email > Guest Phone > IP
**Purpose**: Prevent order spam and fraudulent activity

```typescript
// Examples of protected endpoints
POST /api/v1/orders
POST /api/v1/orders/guest
```

### 3. Cart Operations (`cartRateLimit`)
**Limit**: 50 operations per 15 minutes
**Applied to**: Add, update, remove cart items
**Key Strategy**: User ID or IP address

```typescript
// Examples of protected endpoints
GET /api/v1/cart
POST /api/v1/cart/items
PATCH /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
```

### 4. Search Operations (`searchRateLimit`)
**Limit**: 30 searches per 5 minutes
**Applied to**: Product searches and filtering
**Purpose**: Prevent search abuse and excessive database queries

### 5. Review Submissions (`reviewRateLimit`)
**Limit**: 3 reviews per day
**Applied to**: Review creation endpoints
**Key Strategy**: User ID or IP address

### 6. General API (`generalRateLimit`)
**Limit**: 100 requests per 15 minutes
**Applied to**: Default rate limit for most endpoints
**Key Strategy**: User ID or IP address

### 7. Strict Operations (`strictRateLimit`)
**Limit**: 3 requests per 10 minutes
**Applied to**: Sensitive operations like password changes
**Purpose**: Extra protection for high-security actions

### 8. Admin Operations (`adminRateLimit`)
**Limit**: 500 requests per 15 minutes
**Applied to**: Admin-only endpoints
**Key Strategy**: Admin user ID

### 9. Dynamic Rate Limiting (`dynamicRateLimit`)
**Smart rate limiting that adjusts based on user type:**
- **Admin users**: Uses `adminRateLimit` (500 requests)
- **Authenticated users**: Uses `generalRateLimit` (100 requests)
- **Guest users**: Uses `guestRateLimit` (20 requests)

## Implementation

### Middleware Usage

```typescript
import { authRateLimit, orderCreationRateLimit } from '../middleware/rateLimiter';

// Apply to authentication routes
router.post('/login', authRateLimit, validate(loginSchema), controller.login);

// Apply to order creation
router.post('/orders', orderCreationRateLimit, authenticate, controller.create);

// Use dynamic rate limiting
router.get('/products', dynamicRateLimit, controller.getProducts);
```

### Response Format

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": 900,
  "limit": 5,
  "remaining": 0,
  "reset": "2024-01-06T15:45:00.000Z"
}
```

### HTTP Headers

All responses include rate limiting headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704556500
```

## Configuration

### Environment Variables

```bash
# Redis Configuration (for rate limiting storage)
REDIS_URL=redis://localhost:6379

# Rate Limiting Controls
RATE_LIMIT_ENABLED=true
RATE_LIMIT_TRUST_PROXY=true
```

### Custom Rate Limits

To create custom rate limiters:

```typescript
import { createRateLimiter } from '../middleware/rateLimiter';

const customRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // 25 requests per hour
  message: 'Custom rate limit message',
  keyGenerator: (req) => {
    // Custom key generation logic
    return `custom_${req.ip}`;
  }
});
```

## Key Generation Strategy

The rate limiting system uses intelligent key generation:

1. **Authenticated Users**: `user_${userId}` or `admin_${userId}`
2. **Guest Orders**: `order_guest_email_${email}` or `order_guest_phone_${phone}`
3. **Guest Users**: `guest_${ip}`
4. **Default**: `ip_${ipAddress}`

This ensures fair limiting while preventing abuse.

## Redis Integration

### Scaling Across Instances

Rate limits are stored in Redis, allowing multiple API instances to share rate limit counters:

```typescript
// Rate limits are shared across all server instances
const store = new RedisStore({
  sendCommand: (...args: string[]) => redisClient.sendCommand(args),
});
```

### Fallback Behavior

If Redis is unavailable, the system gracefully falls back to in-memory storage:

```typescript
store: redisClient ? new RedisStore({...}) : undefined, // Memory fallback
```

## Testing Rate Limits

### Manual Testing

```bash
# Test authentication rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"invalid"}'
done
```

### Programmatic Testing

```typescript
import axios from 'axios';

// Test rate limiting
for (let i = 0; i < 10; i++) {
  try {
    const response = await axios.get('/api/v1/products');
    console.log(`Request ${i}: ${response.headers['x-ratelimit-remaining']} remaining`);
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('Rate limit exceeded!');
      break;
    }
  }
}
```

## Best Practices

### 1. Progressive Limits
- Start with permissive limits
- Monitor usage patterns
- Tighten limits based on actual usage

### 2. User Communication
- Always include clear error messages
- Provide retry-after information
- Document rate limits in API documentation

### 3. Monitoring
- Track rate limit hits in logs
- Monitor Redis performance
- Set up alerts for excessive rate limiting

### 4. Exemptions
- Consider API key-based exemptions for partners
- Implement whitelist for trusted IPs
- Provide higher limits for premium users

## Common Issues & Solutions

### Issue: Rate Limits Too Restrictive
**Solution**: Analyze usage patterns and adjust limits accordingly

```typescript
// Monitor actual usage before setting limits
const customRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
});
```

### Issue: Redis Connection Problems
**Solution**: Graceful fallback and monitoring

```typescript
// The system automatically falls back to memory store
// Monitor Redis health and connection status
```

### Issue: Mobile Apps Hitting Limits
**Solution**: Use device-specific identification

```typescript
keyGenerator: (req) => {
  const deviceId = req.headers['x-device-id'];
  const userId = req.user?.id;
  
  if (userId) return `user_${userId}`;
  if (deviceId) return `device_${deviceId}`;
  return `ip_${req.ip}`;
}
```

## Security Benefits

1. **DDoS Protection**: Prevents overwhelming the server
2. **Brute Force Prevention**: Limits password guessing attempts
3. **Resource Protection**: Prevents database overload
4. **Fair Usage**: Ensures all users get equal access
5. **Cost Control**: Limits computational resource usage

## Performance Impact

- **Minimal Latency**: Redis lookups add ~1-2ms per request
- **Memory Usage**: Negligible when using Redis
- **CPU Overhead**: Minimal processing required
- **Network**: Small additional Redis traffic

## Future Enhancements

- **Adaptive Limits**: AI-based dynamic limit adjustment
- **Geographic Limits**: Different limits by region
- **Time-based Limits**: Different limits by time of day
- **Behavioral Analysis**: Detect and limit suspicious patterns
- **API Key Management**: Token-based rate limiting

## Compliance

The rate limiting system helps with:
- **GDPR**: Protects against data scraping
- **SOC 2**: Demonstrates access controls
- **PCI DSS**: Protects payment-related endpoints
- **General Security**: Industry-standard protection

This comprehensive rate limiting system ensures the Omade Cravings API remains stable, secure, and performant under all conditions.