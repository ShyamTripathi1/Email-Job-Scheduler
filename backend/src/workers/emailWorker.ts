import { Worker, Job } from 'bullmq';
import { redis } from '../services/redis';
import { prisma } from '../services/db';
import { sendEmail } from '../services/mailer';
import { checkAndIncrement, startOfNextHour } from '../services/rateLimiter';
import { indexEmail, ensureIndex } from '../services/elasticsearch';
import { notifyRateLimit } from '../services/slack';
import { emailQueue, scheduleEmail, EmailJobPayload } from '../queues/emailQueue';

const MIN_DELAY_MS = Number(process.env.MIN_DELAY_BETWEEN_SENDS_MS) || 1000;
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 5;

async function processEmailJob(job: Job<EmailJobPayload>): Promise<void> {
  const { emailJobId, userId, recipientEmail, recipientName, subject, body, position = 0 } =
    job.data;

  // ── STEP 1: Idempotency Check ─────────────────────────────────────────────
  const dbJob = await prisma.emailJob.findUnique({ where: { id: emailJobId } });
  if (!dbJob) {
    console.warn(`⚠️  DB job ${emailJobId} not found — skipping`);
    return;
  }
  if (dbJob.status === 'SENT') {
    console.log(`✅ Job ${emailJobId} already sent — idempotency guard triggered`);
    return;
  }

  // Mark as SENDING (optimistic lock)
  await prisma.emailJob.update({
    where: { id: emailJobId },
    data: { status: 'SENDING' },
  });

  // ── STEP 2: Rate Limit Check ──────────────────────────────────────────────
  const rateResult = await checkAndIncrement(userId);

  if (!rateResult.allowed) {
    console.log(
      `🚦 Rate limit hit for user ${userId} (${rateResult.count}/${rateResult.limit}) — rescheduling ${emailJobId}`
    );

    // Reschedule to next hour, preserving relative order with per-job delay
    const rescheduleAt = new Date(
      rateResult.nextWindowStart.getTime() + position * MIN_DELAY_MS
    );

    // Generate a new BullMQ jobId for the rescheduled job
    const newBullJobId = `${emailJobId}-retry-${Date.now()}`;
    await emailQueue.add(
      newBullJobId,
      { ...job.data, position },
      {
        jobId: newBullJobId,
        delay: Math.max(0, rescheduleAt.getTime() - Date.now()),
      }
    );

    // Update DB status
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { status: 'RATE_LIMITED', scheduledAt: rescheduleAt },
    });

    // Record rate limit event (deduplicate by hour window)
    const hourWindow = `${rescheduleAt.getUTCFullYear()}-${String(rescheduleAt.getUTCMonth() + 1).padStart(2, '0')}-${String(rescheduleAt.getUTCDate()).padStart(2, '0')}-${String(rescheduleAt.getUTCHours()).padStart(2, '0')}`;
    const existing = await prisma.rateLimitEvent.findFirst({
      where: { userId, hourWindow, notifiedSlack: false },
    });

    if (!existing) {
      const event = await prisma.rateLimitEvent.create({
        data: { userId, hourWindow },
      });

      // Notify Slack
      const notified = await notifyRateLimit({
        userId,
        count: rateResult.count,
        limit: rateResult.limit,
        nextWindowStart: rateResult.nextWindowStart,
        recipientEmail,
      });

      if (notified) {
        await prisma.rateLimitEvent.update({
          where: { id: event.id },
          data: { notifiedSlack: true },
        });
      }
    }

    return;
  }

  // ── STEP 3: Send Email ────────────────────────────────────────────────────
  try {
    const result = await sendEmail({
      to: recipientEmail,
      toName: recipientName,
      subject,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${body}</div>`,
    });

    const now = new Date();

    // ── STEP 4: Update DB ─────────────────────────────────────────────────
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'SENT',
        sentAt: now,
        etherealPreview: result.previewUrl,
      },
    });

    // ── STEP 5: Index in Elasticsearch ───────────────────────────────────
    await indexEmail({
      id: emailJobId,
      userId,
      recipientEmail,
      recipientName,
      subject,
      body,
      status: 'SENT',
      scheduledAt: dbJob.scheduledAt,
      sentAt: now,
      createdAt: dbJob.createdAt,
    });

    console.log(`✅ Job ${emailJobId} → sent to ${recipientEmail}`);
  } catch (err) {
    const errMsg = (err as Error).message;
    console.error(`❌ Job ${emailJobId} failed:`, errMsg);

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'FAILED',
        failureReason: errMsg,
        retryCount: { increment: 1 },
      },
    });

    // Re-throw so BullMQ can retry via backoff policy
    throw err;
  }
}

export function startEmailWorker(): Worker<EmailJobPayload> {
  // Ensure ES index exists before processing any jobs
  ensureIndex().catch(console.error);

  const worker = new Worker<EmailJobPayload>('email-jobs', processEmailJob, {
    connection: redis,
    concurrency: WORKER_CONCURRENCY,
  });

  worker.on('completed', (job) =>
    console.log(`🎉 BullMQ job ${job.id} completed`)
  );
  worker.on('failed', (job, err) =>
    console.error(`💥 BullMQ job ${job?.id} failed:`, err.message)
  );
  worker.on('error', (err) =>
    console.error('BullMQ worker error:', err)
  );

  return worker;
}
