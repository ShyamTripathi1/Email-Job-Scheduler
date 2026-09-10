/**
 * Load Test Script
 *
 * Enqueues 1000 email jobs and monitors queue drain.
 * Run: npm run loadtest
 *
 * Prerequisites:
 *   docker compose up -d postgres redis
 *   cp backend/.env.example backend/.env  (and fill in DATABASE_URL)
 */

import 'dotenv/config';
import { prisma } from '../src/services/db';
import { scheduleEmail } from '../src/queues/emailQueue';
import { emailQueue } from '../src/queues/emailQueue';

const TOTAL_JOBS = 1000;
const BATCH_SIZE = 50;
const START_DELAY_MS = 5000; // First email sends in 5 seconds

async function main() {
  console.log(`🚀 Starting load test: enqueuing ${TOTAL_JOBS} jobs...`);
  const startTime = Date.now();

  const testUserId = `loadtest-user-${Date.now()}`;

  // Enqueue in batches to avoid memory spikes
  for (let i = 0; i < TOTAL_JOBS; i += BATCH_SIZE) {
    const batchPromises = [];
    for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL_JOBS); j++) {
      const scheduledAt = new Date(Date.now() + START_DELAY_MS + j * 100); // 100ms apart

      const dbJob = await prisma.emailJob.create({
        data: {
          userId: testUserId,
          recipientEmail: `recipient${j}@loadtest.example`,
          recipientName: `Recipient ${j}`,
          subject: `Load Test Email #${j}`,
          body: `<p>This is load test email number ${j}.</p>`,
          scheduledAt,
          status: 'SCHEDULED',
        },
      });

      batchPromises.push(
        scheduleEmail(
          {
            emailJobId: dbJob.id,
            userId: testUserId,
            recipientEmail: `recipient${j}@loadtest.example`,
            recipientName: `Recipient ${j}`,
            subject: `Load Test Email #${j}`,
            body: `<p>This is load test email number ${j}.</p>`,
            position: j,
          },
          scheduledAt
        )
      );
    }
    await Promise.all(batchPromises);
    console.log(`  ✅ Enqueued ${Math.min(i + BATCH_SIZE, TOTAL_JOBS)} / ${TOTAL_JOBS}`);
  }

  const enqueueTime = Date.now() - startTime;
  console.log(`\n📊 Enqueue complete in ${enqueueTime}ms`);

  // Monitor queue drain
  console.log('\n⏳ Monitoring queue drain (checking every 10s)...');
  console.log('   (Rate limiting is active — some jobs will be rescheduled)\n');

  let lastDelayed = -1;
  let lastActive = -1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [delayed, active, completed, failed] = await Promise.all([
      emailQueue.getDelayedCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);

    if (delayed !== lastDelayed || active !== lastActive) {
      console.log(
        `[${new Date().toISOString()}] delayed=${delayed} active=${active} completed=${completed} failed=${failed}`
      );
      lastDelayed = delayed;
      lastActive = active;
    }

    if (delayed === 0 && active === 0) {
      console.log('\n🎉 Queue drained!');

      // Verify rate limit compliance
      const sentCount = await prisma.emailJob.count({
        where: { userId: testUserId, status: 'SENT' },
      });
      const rateLimitedCount = await prisma.emailJob.count({
        where: { userId: testUserId, status: 'RATE_LIMITED' },
      });
      const failedCount = await prisma.emailJob.count({
        where: { userId: testUserId, status: 'FAILED' },
      });

      console.log('\n📈 Final Stats:');
      console.log(`  Total jobs:       ${TOTAL_JOBS}`);
      console.log(`  Sent:             ${sentCount}`);
      console.log(`  Rate-limited:     ${rateLimitedCount}`);
      console.log(`  Failed:           ${failedCount}`);
      console.log(`  Total time:       ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
      break;
    }

    await new Promise((r) => setTimeout(r, 10_000));
  }

  await prisma.$disconnect();
  await emailQueue.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
