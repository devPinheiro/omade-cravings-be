import { createClient } from 'redis';

let redisClient: any = null;

export const connectRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 1000, // 1 second timeout for tests
    },
  });

  client.on('error', (error) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Redis Client Error:', error);
    }
  });

  client.on('connect', () => {
    console.log('Redis connected successfully');
  });

  // Add timeout to connection attempt
  const connectPromise = client.connect();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Redis connection timeout')), 2000);
  });

  try {
    await Promise.race([connectPromise, timeoutPromise]);
    redisClient = client;
    return client;
  } catch (error) {
    await client.quit().catch(() => {}); // Ignore quit errors
    throw error;
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};