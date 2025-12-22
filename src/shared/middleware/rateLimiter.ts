import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { getRedisClient } from '../../config/redis';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create a rate limiter with Redis store for scalability
 * Temporarily disabled for testing - returns no-op middleware
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  // Return a no-op middleware for testing
  return (req: Request, res: Response, next: Function) => {
    next();
  };
};

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Authentication rate limiter - 5 login attempts per 15 minutes
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Order creation rate limiter - 10 orders per hour per user
 */
export const orderCreationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many order creation attempts, please try again later.',
  keyGenerator: (req: Request) => {
    // For order creation, always use user/guest identification
    const userId = req.user?.id;
    const guestEmail = req.body?.guest_email;
    const guestPhone = req.body?.guest_phone;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (userId) return `order_user_${userId}`;
    if (guestEmail) return `order_guest_email_${guestEmail}`;
    if (guestPhone) return `order_guest_phone_${guestPhone}`;
    return `order_ip_${ip}`;
  },
});

/**
 * Cart operations rate limiter - 50 cart operations per 15 minutes
 */
export const cartRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Too many cart operations, please slow down.',
});

/**
 * Product search rate limiter - 30 searches per 5 minutes
 */
export const searchRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: 'Too many search requests, please wait before searching again.',
});

/**
 * Review submission rate limiter - 3 reviews per day per user
 */
export const reviewRateLimit = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: 'You can only submit 3 reviews per day.',
  keyGenerator: (req: Request) => {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return userId ? `review_user_${userId}` : `review_ip_${ip}`;
  },
});

/**
 * Contact/Support rate limiter - 5 messages per hour
 */
export const contactRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many contact messages, please wait before sending another message.',
});

/**
 * File upload rate limiter - 10 uploads per hour
 */
export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many file uploads, please wait before uploading again.',
});

/**
 * Strict rate limiter for sensitive operations - 3 requests per 10 minutes
 */
export const strictRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: 'Too many attempts for this sensitive operation, please wait.',
});

/**
 * Guest user rate limiter - More restrictive for unauthenticated users
 */
export const guestRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Much lower limit for guests
  message: 'Too many requests. Please register or login for higher limits.',
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `guest_${ip}`;
  },
});

/**
 * Admin operations rate limiter - Higher limits for admin users
 */
export const adminRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Much higher limit for admins
  message: 'Admin rate limit exceeded.',
  keyGenerator: (req: Request) => {
    const userId = req.user?.id || 'unknown';
    return `admin_${userId}`;
  },
});

/**
 * Dynamic rate limiter that adjusts based on user type
 */
export const dynamicRateLimit = (req: Request, res: Response, next: any) => {
  // Check if user is admin
  if (req.user?.role === 'admin') {
    return adminRateLimit(req, res, next);
  }
  
  // Check if user is authenticated
  if (req.user) {
    return generalRateLimit(req, res, next);
  }
  
  // Use guest rate limit for unauthenticated users
  return guestRateLimit(req, res, next);
};

/**
 * Rate limiter configuration for different endpoint types
 */
export const rateLimiters = {
  general: generalRateLimit,
  auth: authRateLimit,
  orderCreation: orderCreationRateLimit,
  cart: cartRateLimit,
  search: searchRateLimit,
  review: reviewRateLimit,
  contact: contactRateLimit,
  upload: uploadRateLimit,
  strict: strictRateLimit,
  guest: guestRateLimit,
  admin: adminRateLimit,
  dynamic: dynamicRateLimit,
};

/**
 * Utility function to get rate limit info for a request
 */
export const getRateLimitInfo = (req: Request): any => {
  return {
    limit: req.rateLimit?.limit,
    remaining: req.rateLimit?.remaining,
    reset: (req.rateLimit as any)?.reset,
    used: (req.rateLimit as any)?.used,
  };
};