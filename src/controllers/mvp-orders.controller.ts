import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { mvpOrdersService } from '../services/mvp-orders.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  res.json(await mvpOrdersService.list(userId));
});

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  const order = await mvpOrdersService.get(userId, req.params.id);
  if (!order) throw new AppError(404, 'not_found', 'Order not found');
  res.json(order);
});
