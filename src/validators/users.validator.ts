import { AppError } from '../errors/AppError';
import type { UserRole } from '../dubicolt/types';

const ROLES: UserRole[] = ['buyer', 'admin', 'vendor'];

function validateEmail(email: string, details: Record<string, string[]>, key = 'email') {
  if (!email) details[key] = ['Email is required'];
}

function validatePassword(password: string, details: Record<string, string[]>, key = 'password') {
  if (!password || password.length < 8) {
    details[key] = ['Password must be at least 8 characters'];
  }
}

export function validateCreateUser(body: Record<string, unknown>) {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const role = String(body.role ?? 'buyer').trim() as UserRole;
  const details: Record<string, string[]> = {};

  if (!name || name.length < 2) details.name = ['Full name must be at least 2 characters'];
  validateEmail(email, details);
  validatePassword(password, details);
  if (!ROLES.includes(role)) details.role = ['Role must be buyer, admin, or vendor'];

  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }

  return { name, email, password, role };
}

export function validateUpdateUser(body: Record<string, unknown>) {
  const details: Record<string, string[]> = {};
  const data: {
    name?: string;
    email?: string;
    role?: UserRole;
    is_active?: boolean;
    password?: string;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length < 2) details.name = ['Full name must be at least 2 characters'];
    else data.name = name;
  }
  if (body.email !== undefined) {
    const email = String(body.email).trim();
    if (!email) details.email = ['Email is required'];
    else data.email = email;
  }
  if (body.role !== undefined) {
    const role = String(body.role).trim() as UserRole;
    if (!ROLES.includes(role)) details.role = ['Role must be buyer, admin, or vendor'];
    else data.role = role;
  }
  if (body.is_active !== undefined) data.is_active = Boolean(body.is_active);
  if (body.password !== undefined && String(body.password).length > 0) {
    validatePassword(String(body.password), details);
    data.password = String(body.password);
  }

  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }
  if (Object.keys(data).length === 0) {
    throw new AppError(400, 'validation_error', 'No fields to update');
  }

  return data;
}

export function validateUpdateProfile(body: Record<string, unknown>) {
  const details: Record<string, string[]> = {};
  const data: { name?: string } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length < 2) details.name = ['Full name must be at least 2 characters'];
    else data.name = name;
  }

  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }
  if (Object.keys(data).length === 0) {
    throw new AppError(400, 'validation_error', 'No fields to update');
  }

  return data;
}

export function validateChangePassword(body: Record<string, unknown>) {
  const currentPassword = String(body.current_password ?? body.currentPassword ?? '');
  const newPassword = String(body.new_password ?? body.newPassword ?? '');
  const details: Record<string, string[]> = {};

  if (!currentPassword) details.current_password = ['Current password is required'];
  validatePassword(newPassword, details, 'new_password');
  if (currentPassword && newPassword && currentPassword === newPassword) {
    details.new_password = ['New password must be different from current password'];
  }

  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }

  return { currentPassword, newPassword };
}
