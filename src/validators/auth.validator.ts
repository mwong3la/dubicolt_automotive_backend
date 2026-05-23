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
  name: string;
  email: string;
  password: string;
} {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const details: Record<string, string[]> = {};
  if (!name || name.length < 2) {
    details.name = ['Full name must be at least 2 characters'];
  }
  if (!email) details.email = ['Email is required'];
  if (!password || password.length < 8) {
    details.password = ['Password must be at least 8 characters'];
  }
  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }
  return { name, email, password };
}
