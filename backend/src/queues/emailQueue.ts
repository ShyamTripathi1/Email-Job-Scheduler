import { Queue } from 'bullmq';
import { redis } from '../services/redis';

export interface EmailJobPayload {
  emailJobId: string;   // PostgreSQL UUID — used as BullMQ jobId for idempotency
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  position?: number;    // Position within a batch (used for rescheduled ordering)
}

export const emailQueue = new Queue<EmailJobPayload>('email-jobs', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: false,   // Keep completed jobs for audit
    removeOnFail: false,       // Keep failed jobs for debugging
    attempts: 3,               // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

/**
 * Enqueues an email job to be sent at `scheduledAt`.
 * Uses the PostgreSQL UUID as the BullMQ jobId to guarantee at-most-once delivery.
 */
export async function scheduleEmail(
  payload: EmailJobPayload,
  scheduledAt: Date
): Promise<string> {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());

  const job = await emailQueue.add(payload.emailJobId, payload, {
    jobId: payload.emailJobId,  // Idempotency: duplicate add = no-op in BullMQ
    delay,
  });

  return job.id!;
}
