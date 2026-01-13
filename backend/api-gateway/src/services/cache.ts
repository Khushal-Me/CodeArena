import Redis from 'ioredis';
import logger from '../utils/logger.js';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Cache helper functions
export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<void> => {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error({ err, key }, 'Failed to set cache');
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (err) {
    logger.error({ err, key }, 'Failed to get cache');
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error({ err, key }, 'Failed to delete cache');
  }
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};

export const closeConnection = async (): Promise<void> => {
  await redis.quit();
  logger.info('Redis connection closed');
};

export default { redis, setCache, getCache, deleteCache, checkConnection, closeConnection };
