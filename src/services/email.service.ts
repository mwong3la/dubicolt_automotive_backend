import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';
import { GMAIL_SMTP, formatEmailFrom, smtpCredentials } from '../config/email.config';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const auth = smtpCredentials();
  if (!auth) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: GMAIL_SMTP.host,
    port: GMAIL_SMTP.port,
    secure: GMAIL_SMTP.secure,
    auth,
  });

  return transporter;
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.log('[email:no-smtp]', message.subject, '→', message.to);
    console.log(message.text);
    return false;
  }

  await transport.sendMail({
    from: formatEmailFrom(),
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
