import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

/**
 * Lazily creates (and caches) an Ethereal SMTP test account transporter.
 * Ethereal is a fake SMTP service — emails are captured at ethereal.email.
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  // Create an Ethereal test account (one-time, cached for process lifetime)
  const testAccount = await nodemailer.createTestAccount();
  console.log('📧 Ethereal SMTP account created:', testAccount.user);

  _transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return _transporter;
}

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: opts.from || '"ReachInbox Scheduler" <scheduler@reachinbox.dev>',
    to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) as string;
  console.log(`📨 Email sent → ${opts.to} | Preview: ${previewUrl}`);

  return { messageId: info.messageId, previewUrl };
}
