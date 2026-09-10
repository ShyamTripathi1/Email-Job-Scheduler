/**
 * Idempotency Tests
 *
 * Verifies that double-enqueuing the same job (same jobId) results in exactly one send.
 * Requires: PostgreSQL + Redis running (docker compose up -d postgres redis)
 */

import 'dotenv/config';
import { prisma } from '../services/db';
import { scheduleEmail, EmailJobPayload } from '../queues/emailQueue';
import { emailQueue } from '../queues/emailQueue';

// Small helper: wait N ms
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Idempotency', () => {
  let testJobId: string;

  beforeAll(async () => {
    // Create a DB row to represent a scheduled job
    const job = await prisma.emailJob.create({
      data: {
        userId: 'test-idempotency-user',
        recipientEmail: 'idempotency@example.com',
        subject: 'Idempotency Test',
        body: '<p>Test body</p>',
        scheduledAt: new Date(Date.now() + 5000), // 5s from now
        status: 'SCHEDULED',
      },
    });
    testJobId = job.id;
  });

  afterAll(async () => {
    await prisma.emailJob.deleteMany({ where: { userId: 'test-idempotency-user' } });
    await prisma.$disconnect();
    await emailQueue.close();
  });

  it('enqueues the same job twice but BullMQ only keeps one', async () => {
    const payload: EmailJobPayload = {
      emailJobId: testJobId,
      userId: 'test-idempotency-user',
      recipientEmail: 'idempotency@example.com',
      subject: 'Idempotency Test',
      body: '<p>Test body</p>',
      position: 0,
    };

    const scheduledAt = new Date(Date.now() + 60_000); // 1 minute out

    // Schedule the same job twice
    await scheduleEmail(payload, scheduledAt);
    await scheduleEmail(payload, scheduledAt); // duplicate

    // BullMQ de-duplicates by jobId — count should be 1
    const job = await emailQueue.getJob(testJobId);
    expect(job).not.toBeNull();
    expect(job?.id).toBe(testJobId);

    // Verify only one job exists with this ID
    const delayed = await emailQueue.getDelayed();
    const matchingJobs = delayed.filter((j) => j.id === testJobId);
    expect(matchingJobs.length).toBe(1);
  });

  it('DB job starts in SCHEDULED status (not sent prematurely)', async () => {
    const job = await prisma.emailJob.findUnique({ where: { id: testJobId } });
    expect(job?.status).toBe('SCHEDULED');
    expect(job?.sentAt).toBeNull();
  });
});
