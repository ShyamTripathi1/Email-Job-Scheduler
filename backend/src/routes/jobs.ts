import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { scheduleEmail } from '../queues/emailQueue';
import { searchEmails } from '../services/elasticsearch';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ── POST /api/jobs ─── Schedule one or many email jobs ────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const {
      recipients,          // [{ email: string, name?: string }]
      subject,
      body,
      startAt,             // ISO string — when to send the first email
      delayBetweenMs = Number(process.env.MIN_DELAY_BETWEEN_SENDS_MS) || 1000,
    } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients must be a non-empty array' });
    }
    if (!subject || !body || !startAt) {
      return res.status(400).json({ error: 'subject, body, and startAt are required' });
    }

    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'startAt is not a valid ISO date string' });
    }

    const jobs = [];
    for (let i = 0; i < recipients.length; i++) {
      const { email, name } = recipients[i];
      const scheduledAt = new Date(startDate.getTime() + i * delayBetweenMs);

      // Persist to DB first (source of truth)
      const dbJob = await prisma.emailJob.create({
        data: {
          userId: user.id,
          recipientEmail: email,
          recipientName: name,
          subject,
          body,
          scheduledAt,
          status: 'SCHEDULED',
        },
      });

      // Enqueue the BullMQ delayed job (idempotent: jobId = dbJob.id)
      await scheduleEmail(
        {
          emailJobId: dbJob.id,
          userId: user.id,
          recipientEmail: email,
          recipientName: name,
          subject,
          body,
          position: i,
        },
        scheduledAt
      );

      // Write bullmqJobId back to DB
      await prisma.emailJob.update({
        where: { id: dbJob.id },
        data: { bullmqJobId: dbJob.id },
      });

      jobs.push(dbJob);
    }

    res.status(201).json({ scheduled: jobs.length, jobs });
  } catch (err) {
    console.error('POST /api/jobs error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/jobs ─── List scheduled and sent jobs ───────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(100, parseInt(limit as string, 10));

    const where: any = { userId: user.id };
    if (status) where.status = String(status).toUpperCase();

    const [total, jobs] = await Promise.all([
      prisma.emailJob.count({ where }),
      prisma.emailJob.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ total, page: pageNum, limit: pageSize, jobs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/jobs/search ─── Full-text search via Elasticsearch ───────────────
router.get('/search', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { q, from = '0', size = '20' } = req.query;

    if (!q) return res.status(400).json({ error: 'q (query) parameter is required' });

    const results = await searchEmails(
      user.id,
      q as string,
      parseInt(from as string, 10),
      parseInt(size as string, 10)
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /api/jobs/:id ─── Get a single job ────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const job = await prisma.emailJob.findFirst({
      where: { id: req.params.id, userId: user.id },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
