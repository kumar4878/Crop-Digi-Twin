import Redis from 'ioredis';
import { config } from '../config/env';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    console.log('[cache]: Redis connected successfully');
  } catch (error) {
    console.warn('[cache]: Redis connection failed, running without cache:', (error as Error).message);
  }
}

redis.on('error', (err) => {
  console.warn('[cache]: Redis error:', err.message);
});
