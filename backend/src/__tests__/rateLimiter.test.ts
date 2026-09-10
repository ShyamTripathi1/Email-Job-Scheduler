/**
 * Rate Limiter Unit Tests
 *
 * These tests run against a real Redis instance (localhost:6379).
 * Make sure Redis is running before executing: docker compose up -d redis
 */

import {
  checkAndIncrement,
  getCurrentCount,
  resetCounter,
  getHourWindow,
  startOfNextHour,
} from '../services/rateLimiter';

// Override limit to 5 for testing
process.env.MAX_EMAILS_PER_HOUR = '5';

const TEST_USER_ID = `test-user-ratelimit-${Date.now()}`;

describe('RateLimiter', () => {
  afterEach(async () => {
    await resetCounter(TEST_USER_ID);
  });

  it('allows sends within the hourly limit', async () => {
    for (let i = 1; i <= 5; i++) {
      const result = await checkAndIncrement(TEST_USER_ID);
      expect(result.allowed).toBe(true);
      expect(result.count).toBe(i);
    }
  });

  it('blocks the (limit+1)th send', async () => {
    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      await checkAndIncrement(TEST_USER_ID);
    }

    const result = await checkAndIncrement(TEST_USER_ID);
    expect(result.allowed).toBe(false);
    expect(result.count).toBe(6);
  });

  it('returns the correct next window start', async () => {
    const now = new Date();
    const result = await checkAndIncrement(TEST_USER_ID);
    const expectedNext = startOfNextHour(now);

    // Allow ±5 seconds tolerance for test execution time
    const diff = Math.abs(result.nextWindowStart.getTime() - expectedNext.getTime());
    expect(diff).toBeLessThan(5000);
  });

  it('getCurrentCount returns 0 before any sends', async () => {
    const count = await getCurrentCount(`no-sends-user-${Date.now()}`);
    expect(count).toBe(0);
  });

  it('getHourWindow format is YYYY-MM-DD-HH', () => {
    const date = new Date('2024-06-15T14:30:00.000Z');
    expect(getHourWindow(date)).toBe('2024-06-15-14');
  });

  it('startOfNextHour is exactly 1 hour ahead at minute boundary', () => {
    const date = new Date('2024-06-15T14:00:00.000Z');
    const next = startOfNextHour(date);
    expect(next.toISOString()).toBe('2024-06-15T15:00:00.000Z');
  });

  it('startOfNextHour truncates minutes/seconds', () => {
    const date = new Date('2024-06-15T14:45:30.123Z');
    const next = startOfNextHour(date);
    expect(next.getUTCMinutes()).toBe(0);
    expect(next.getUTCSeconds()).toBe(0);
    expect(next.getUTCMilliseconds()).toBe(0);
    expect(next.getUTCHours()).toBe(15);
  });

  it('counter resets after resetCounter()', async () => {
    await checkAndIncrement(TEST_USER_ID);
    await checkAndIncrement(TEST_USER_ID);
    await resetCounter(TEST_USER_ID);
    const count = await getCurrentCount(TEST_USER_ID);
    expect(count).toBe(0);
  });
});
