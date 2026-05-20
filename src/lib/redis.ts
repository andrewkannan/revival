import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis | undefined };

const redisUrl = process.env.REDIS_URL;

const createRedisClient = () => {
  if (redisUrl) {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false, // Prevents commands from hanging forever if Redis is down
      commandTimeout: 3000,
      retryStrategy(times) {
        return Math.min(times * 100, 3000); // Reconnect with a delay
      }
    });
    
    // Prevent unhandled error events from crashing the entire Node.js server
    client.on('error', (err) => {
      console.warn('Redis connection error (non-fatal):', err.message);
    });
    
    return client;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return null as unknown as Redis;
  }
  
  const localClient = new Redis({ host: 'localhost', port: 6379 });
  localClient.on('error', (err) => {
    console.warn('Local Redis connection error:', err.message);
  });
  
  return localClient;
};

export const redis = globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== 'production' && redis) globalForRedis.redis = redis;
