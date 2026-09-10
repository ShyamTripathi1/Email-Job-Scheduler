import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { prisma } from './services/db';
import { redis } from './services/redis';
import { emailQueue } from './queues/emailQueue';
import { startEmailWorker } from './workers/emailWorker';
import { configurePassport } from './services/passport';

import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import slackRoutes from './routes/slack';

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── SESSION (Redis store) ─────────────────────────────────────────────────────
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});
redisClient.connect().catch(console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ── PASSPORT ──────────────────────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ── BULL BOARD ────────────────────────────────────────────────────────────────
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/slack', slackRoutes);

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const pong = await redis.ping();
    res.json({ status: 'ok', db: 'connected', redis: pong === 'PONG' ? 'connected' : 'error' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: (err as Error).message });
  }
});

// ── BOOT ──────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    await redis.ping();
    console.log('✅ Redis connected');

    startEmailWorker();
    console.log('✅ Email worker started');

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📊 BullMQ dashboard at http://localhost:${PORT}/admin/queues`);
    });
  } catch (err) {
    console.error('❌ Boot failed:', err);
    process.exit(1);
  }
}

boot();
