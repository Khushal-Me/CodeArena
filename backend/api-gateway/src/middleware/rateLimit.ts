import type { Request, Response, NextFunction } from 'express';
import { redis } from '../services/cache.js';
import logger from '../utils/logger.js';
import type { ApiError } from '../types/index.js';

const RATE_LIMIT_WINDOW_MS = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '5', 10);

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// Get session ID from request (from body, query, or header)
const getSessionId = (req: Request): string | null => {
  return (
    (req.body as { sessionId?: string })?.sessionId ??
    (req.query['sessionId'] as string | undefined) ??
    req.headers['x-session-id'] as string | undefined ??
    null
  );
};

// Get current minute bucket for sliding window
const getCurrentBucket = (): number => {
  return Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
};

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sessionId = getSessionId(req);
  
  // Skip rate limiting if no session ID
  if (!sessionId) {
    next();
    return;
  }

  const bucket = getCurrentBucket();
  const key = `ratelimit:${sessionId}:${bucket}`;

  try {
    // Increment counter with expiry
    const count = await redis.incr(key);
    
    // Set expiry on first request in this window
    if (count === 1) {
      await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 1);
    }

    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - count);
    const resetTime = (bucket + 1) * RATE_LIMIT_WINDOW_MS;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());

    if (count > RATE_LIMIT_MAX_REQUESTS) {
      logger.warn({ sessionId, count }, 'Rate limit exceeded');
      
      const apiError: ApiError = {
        error: 'RateLimitExceeded',
        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
        statusCode: 429,
        details: {
          limit: RATE_LIMIT_MAX_REQUESTS,
          remaining: 0,
          resetTime: new Date(resetTime).toISOString(),
        },
      };

      res.status(429).json(apiError);
      return;
    }

    next();
  } catch (error) {
    // If Redis fails, allow the request but log the error
    logger.error({ err: error, sessionId }, 'Rate limit check failed');
    next();
  }
};

// Stricter rate limiter for submissions
export const submissionRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sessionId = getSessionId(req);
  
  if (!sessionId) {
    const apiError: ApiError = {
      error: 'BadRequest',
      message: 'Session ID is required for submissions',
      statusCode: 400,
    };
    res.status(400).json(apiError);
    return;
  }

  // Use the standard rate limiter
  await rateLimiter(req, res, next);
};

export default { rateLimiter, submissionRateLimiter };
