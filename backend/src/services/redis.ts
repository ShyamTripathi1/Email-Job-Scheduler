import IORedis from 'ioredis';

export const redis = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

redis.on('connect', () => console.log('🔗 Redis client connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));
