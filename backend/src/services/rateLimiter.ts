import { redis } from './redis';

const MAX_EMAILS_PER_HOUR = Number(process.env.MAX_EMAILS_PER_HOUR) || 100;

/**
 * Returns the Redis key for a user's rate-limit counter in a given UTC hour window.
 * Format: ratelimit:{userId}:{YYYY-MM-DD-HH}
 */
export function getHourWindow(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  return `${y}-${m}-${d}-${h}`;
}

function rateLimitKey(userId: string, window: string): string {
  return `ratelimit:${userId}:${window}`;
}

/** Returns the Unix timestamp (seconds) for the start of the NEXT UTC hour */
export function startOfNextHour(date: Date = new Date()): Date {
  const next = new Date(date);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  nextWindowStart: Date;
}

/**
 * Atomically checks and increments the hourly counter for a user.
 * Uses MULTI/EXEC for atomicity. Sets TTL to expire at end of current hour.
 *
 * @returns `{ allowed: true }` if the send is within quota, `{ allowed: false }` otherwise.
 */
export async function checkAndIncrement(
  userId: string,
  forDate: Date = new Date()
): Promise<RateLimitResult> {
  const window = getHourWindow(forDate);
  const key = rateLimitKey(userId, window);
  const nextWindow = startOfNextHour(forDate);
  const expireAt = Math.floor(nextWindow.getTime() / 1000); // Unix seconds

  // Use pipeline for atomic INCR + EXPIREAT
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expireat(key, expireAt);
  const results = await pipeline.exec();

  const count = (results?.[0]?.[1] as number) ?? 1;
  const allowed = count <= MAX_EMAILS_PER_HOUR;

  return { allowed, count, limit: MAX_EMAILS_PER_HOUR, nextWindowStart: nextWindow };
}

/**
 * Peek at the current counter without incrementing (used for debugging/tests).
 */
export async function getCurrentCount(userId: string, forDate: Date = new Date()): Promise<number> {
  const window = getHourWindow(forDate);
  const key = rateLimitKey(userId, window);
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}

/**
 * Reset a user's counter for the current hour (used in tests).
 */
export async function resetCounter(userId: string, forDate: Date = new Date()): Promise<void> {
  const window = getHourWindow(forDate);
  const key = rateLimitKey(userId, window);
  await redis.del(key);
}
