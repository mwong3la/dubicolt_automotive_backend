import { AppError } from '../errors/AppError';

export function validateLogin(body: Record<string, unknown>): { email: string; password: string } {
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const details: Record<string, string[]> = {};
  if (!email) details.email = ['Email is required'];
  if (!password) details.password = ['Password is required'];
  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }
  return { email, password };
}

export function validateRegister(body: Record<string, unknown>): {
  company_name: string;
  email: string;
  password: string;
} {
  const company_name = String(body.company_name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const details: Record<string, string[]> = {};
  if (!company_name || company_name.length < 2) {
    details.company_name = ['Company name must be at least 2 characters'];
  }
  if (!email) details.email = ['Email is required'];
  if (!password || password.length < 8) {
    details.password = ['Password must be at least 8 characters'];
  }
  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }
  return { company_name, email, password };
}
