/** Gmail SMTP defaults — set SMTP_USER and SMTP_PASS in the environment. */
export const GMAIL_SMTP = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
} as const;

export const EMAIL_DEFAULTS = {
  appBaseUrl:
    process.env.NODE_ENV === 'production' ? 'https://dubicolt.com' : 'http://localhost:3000',
  brandName: 'Dubicolt',
} as const;

export function smtpCredentials(): { user: string; pass: string } | null {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;
  return { user, pass };
}

export function formatEmailFrom(): string {
  const user = process.env.SMTP_USER?.trim();
  const from = process.env.EMAIL_FROM?.trim() || user || 'noreply@dubicolt.com';
  if (from.includes('<')) return from;
  return `${EMAIL_DEFAULTS.brandName} <${from}>`;
}
