const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  slackConnected: boolean;
}

export function getGoogleLoginUrl(): string {
  return `${API_BASE}/api/auth/google`;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/api/auth/me');
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export type JobStatus = 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';

export interface EmailJob {
  id: string;
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string;
  status: JobStatus;
  etherealPreview?: string;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
}

export interface JobsResponse {
  total: number;
  page: number;
  limit: number;
  jobs: EmailJob[];
}

export interface ScheduleRequest {
  recipients: { email: string; name?: string }[];
  subject: string;
  body: string;
  startAt: string;
  delayBetweenMs?: number;
}

export async function getJobs(params?: {
  status?: JobStatus;
  page?: number;
  limit?: number;
}): Promise<JobsResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return apiFetch<JobsResponse>(`/api/jobs?${qs.toString()}`);
}

export async function scheduleJobs(data: ScheduleRequest): Promise<{ scheduled: number; jobs: EmailJob[] }> {
  return apiFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function searchJobs(q: string): Promise<{ total: number; hits: EmailJob[] }> {
  return apiFetch(`/api/jobs/search?q=${encodeURIComponent(q)}`);
}

// ── Slack ─────────────────────────────────────────────────────────────────────
export function getSlackConnectUrl(): string {
  return `${API_BASE}/api/slack/connect`;
}

export async function getSlackStatus(): Promise<{ connected: boolean }> {
  return apiFetch('/api/slack/status');
}

export async function disconnectSlack(): Promise<void> {
  await apiFetch('/api/slack/disconnect', { method: 'DELETE' });
}
