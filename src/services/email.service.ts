import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: user ? { user, pass: pass ?? '' } : undefined,
  });

  return transporter;
}

function emailEnabled(): boolean {
  return process.env.EMAIL_ENABLED !== 'false';
}

function defaultFrom(): string {
  return process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || 'noreply@dubicolt.com';
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!emailEnabled()) {
    console.log('[email:disabled]', message.subject, '→', message.to);
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    console.log('[email:no-smtp]', message.subject, '→', message.to);
    console.log(message.text);
    return false;
  }

  await transport.sendMail({
    from: defaultFrom(),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html ?? message.text.replace(/\n/g, '<br/>'),
  });

  return true;
}

export function formatKes(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString('en-KE')}`;
}
