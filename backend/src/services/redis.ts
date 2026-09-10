import IORedis from 'ioredis';

export const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Avoid false errors during startup
});

redis.on('connect', () => console.log('🔗 Redis client connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));
