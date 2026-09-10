import { prisma } from './db';

const SLACK_API_BASE = 'https://slack.com/api';

export function getSlackOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: 'incoming-webhook,chat:write',
    redirect_uri: process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/slack/callback',
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackCode(code: string): Promise<{
  token: string;
  webhookUrl: string;
  teamName: string;
}> {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/slack/callback',
  });

  const response = await fetch(`${SLACK_API_BASE}/oauth.v2.access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = (await response.json()) as any;
  if (!data.ok) throw new Error(`Slack OAuth error: ${data.error}`);

  return {
    token: data.access_token,
    webhookUrl: data.incoming_webhook?.url,
    teamName: data.team?.name,
  };
}

export interface RateLimitNotification {
  userId: string;
  count: number;
  limit: number;
  nextWindowStart: Date;
  recipientEmail: string;
}

/**
 * Sends a Slack notification when a user's hourly rate limit is hit.
 * Reads the webhook URL from the DB at call-time (not cached) to handle token rotation.
 */
export async function notifyRateLimit(opts: RateLimitNotification): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { slackWebhook: true, slackToken: true, name: true },
  });

  if (!user?.slackWebhook) {
    console.log(`⚠️  Slack not connected for user ${opts.userId} — skipping notification`);
    return false;
  }

  const nextWindow = opts.nextWindowStart.toUTCString();
  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⚠️ Email Rate Limit Reached', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*User:*\n${user.name}` },
          { type: 'mrkdwn', text: `*Sent this hour:*\n${opts.count} / ${opts.limit}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `The email to *${opts.recipientEmail}* has been rescheduled to the next hour window starting at *${nextWindow}*.`,
        },
      },
    ],
  };

  const res = await fetch(user.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`❌ Slack notification failed: HTTP ${res.status}`);
    return false;
  }

  return true;
}
