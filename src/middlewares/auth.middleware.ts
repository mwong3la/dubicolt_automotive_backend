import { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { dubicoltStore } from '../dubicolt/store';
import type { DubicoltUser } from '../dubicolt/types';
import { AppError } from '../errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'dubicolt-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthRequest extends Request {
  user?: DubicoltUser;
}

export function signTokens(user: DubicoltUser) {
  const accessOpts: SignOptions = { expiresIn: '1h' };
  const refreshOpts: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };

  const access_token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    accessOpts,
  );
  const refresh_token = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    refreshOpts,
  );
  return { access_token, refresh_token, expires_in: 3600 };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'unauthorized', 'Authentication required'));
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await dubicoltStore.getUser(decoded.userId);
    if (!user) {
      next(new AppError(401, 'unauthorized', 'Invalid user'));
      return;
    }
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'unauthorized', 'Invalid or expired token'));
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError(401, 'unauthorized', 'Authentication required'));
    return;
  }
  if (req.user.role !== 'admin') {
    next(new AppError(403, 'forbidden', 'Admin access required'));
    return;
  }
  next();
}
