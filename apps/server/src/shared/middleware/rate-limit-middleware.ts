import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { env } from '../config/env';
// ─── Auth Rate Limiter ────────────────────────────────────
// Strict — prevents brute force attacks on login/register
const authRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 50, // 50 attempts
  duration: 60, // per 60 seconds
  blockDuration: 30, // block for 5 minutes after limit hit
});

// ─── API Rate Limiter ─────────────────────────────────────
// Generous — normal API usage
const apiRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:api',
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

// ─── Middleware Factory ───────────────────────────────────
const createRateLimitMiddleware = (limiter: RateLimiterRedis, limitName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (env.NODE_ENV === 'test') {
      next();
      return;
    }
    try {
      // Use IP as key — rate limit per IP address
      const key = req.ip ?? 'unknown';
      const result = await limiter.consume(key);

      // Add rate limit headers — clients can see their remaining quota
      res.setHeader('X-RateLimit-Limit', limiter.points);
      res.setHeader('X-RateLimit-Remaining', result.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toISOString());

      next();
    } catch (rejRes) {
      // Rate limit exceeded
      const msBeforeNext = (rejRes as { msBeforeNext?: number }).msBeforeNext ?? 60000;
      const retryAfter = Math.ceil(msBeforeNext / 1000);

      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        limiter: limitName,
        retryAfter,
      });

      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        success: false,
        statusCode: 429,
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        errors: [],
      });
    }
  };
};

// Export specific limiters
export const authLimiter = createRateLimitMiddleware(authRateLimiter, 'auth');
export const apiLimiter = createRateLimitMiddleware(apiRateLimiter, 'api');
