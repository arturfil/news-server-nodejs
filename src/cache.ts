import { createClient } from 'redis';
import { logger } from './utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

export async function initializeRedis() {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

export { redisClient };
