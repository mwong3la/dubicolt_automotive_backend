import { AppError } from '../errors/AppError';

type MpesaEnv = 'sandbox' | 'production';

function mpesaBase(env: MpesaEnv): string {
  return env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
}

function getConfig() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim();
  const shortcode = process.env.MPESA_SHORTCODE?.trim();
  const passkey = process.env.MPESA_PASSKEY?.trim();
  const callbackUrl = process.env.MPESA_CALLBACK_URL?.trim();
  const env = (process.env.MPESA_ENV?.trim() === 'production' ? 'production' : 'sandbox') as MpesaEnv;

  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
    return null;
  }
  return { consumerKey, consumerSecret, shortcode, passkey, callbackUrl, env };
}

export function isLiveMpesaEnabled(): boolean {
  return getConfig() !== null;
}

function formatTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function stkPassword(shortcode: string, passkey: string, ts: string): string {
  return Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
}

function normalizeMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  return `254${digits}`;
}

async function getAccessToken(config: NonNullable<ReturnType<typeof getConfig>>): Promise<string> {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  const url = `${mpesaBase(config.env)}/oauth/v1/generate?grant_type=client_credentials`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) {
    throw new AppError(502, 'mpesa_auth_failed', 'Could not authenticate with M-Pesa');
  }
  const data = (await res.json()) as { access_token?: string; errorMessage?: string };
  if (!data.access_token) {
    throw new AppError(502, 'mpesa_auth_failed', data.errorMessage ?? 'M-Pesa access token missing');
  }
  return data.access_token;
}

export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
  const config = getConfig();
  if (!config) {
    throw new AppError(500, 'mpesa_not_configured', 'M-Pesa is not configured');
  }

  const token = await getAccessToken(config);
  const ts = formatTimestamp();
  const formattedPhone = normalizeMpesaPhone(params.phone);
  const url = `${mpesaBase(config.env)}/mpesa/stkpush/v1/processrequest`;

  const body = {
    BusinessShortCode: config.shortcode,
    Password: stkPassword(config.shortcode, config.passkey, ts),
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(params.amount),
    PartyA: formattedPhone,
    PartyB: config.shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: config.callbackUrl,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.transactionDesc.slice(0, 13),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    errorMessage?: string;
  };

  if (!res.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
    throw new AppError(
      502,
      'mpesa_stk_failed',
      data.errorMessage || data.ResponseDescription || 'STK push failed',
    );
  }

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID ?? '',
  };
}
