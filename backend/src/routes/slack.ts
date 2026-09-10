import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { getSlackOAuthUrl, exchangeSlackCode } from '../services/slack';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ── GET /api/slack/connect ─── Initiate Slack OAuth ──────────────────────────
router.get('/connect', requireAuth, (req: Request, res: Response) => {
  const user = req.user as any;
  // Use userId as state for CSRF protection
  const oauthUrl = getSlackOAuthUrl(user.id);
  res.redirect(oauthUrl);
});

// ── GET /api/slack/callback ─── Handle Slack OAuth callback ──────────────────
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?slack_error=${error}`);
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  try {
    const { token, webhookUrl, teamName } = await exchangeSlackCode(code as string);

    // Save token and webhook URL to the user (state = userId)
    await prisma.user.update({
      where: { id: state as string },
      data: { slackToken: token, slackWebhook: webhookUrl },
    });

    console.log(`✅ Slack connected for user ${state} (team: ${teamName})`);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?slack_connected=true`);
  } catch (err) {
    console.error('Slack OAuth error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?slack_error=exchange_failed`);
  }
});

// ── GET /api/slack/status ─── Check Slack connection status ──────────────────
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  const user = req.user as any;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { slackToken: true, slackWebhook: true },
  });
  res.json({ connected: !!dbUser?.slackToken });
});

// ── DELETE /api/slack/disconnect ─── Remove Slack integration ────────────────
router.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  const user = req.user as any;
  await prisma.user.update({
    where: { id: user.id },
    data: { slackToken: null, slackWebhook: null },
  });
  res.json({ success: true });
});

export default router;
