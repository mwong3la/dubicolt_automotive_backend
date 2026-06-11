import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { usersService } from '../services/users.service';
import { AppError } from '../errors/AppError';
import { validateCreateUser, validateUpdateUser } from '../validators/users.validator';
import type { AuthRequest } from '../middlewares/auth.middleware';
import type { UserRole } from '../dubicolt/types';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const role = typeof req.query.role === 'string' ? (req.query.role as UserRole) : undefined;
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.page_size ? Number(req.query.page_size) : undefined;
  res.json(await usersService.list({ search, role, page, pageSize }));
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = validateCreateUser(req.body ?? {});
  const row = await usersService.create(data);
  res.status(201).json(row);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = validateUpdateUser(req.body ?? {});
  if (req.params.id === req.user!.id && data.is_active === false) {
    throw new AppError(400, 'validation_error', 'You cannot deactivate your own account');
  }
  const row = await usersService.update(req.params.id, data);
  if (!row) throw new AppError(404, 'not_found', 'User not found');
  res.json(row);
});
