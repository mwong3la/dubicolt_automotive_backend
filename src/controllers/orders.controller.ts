import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ordersService } from '../services/orders.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  res.json(await ordersService.list(userId));
});

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  const order = await ordersService.get(userId, req.params.id);
  if (!order) throw new AppError(404, 'not_found', 'Order not found');
  res.json(order);
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status) throw new AppError(400, 'validation_error', 'status is required');
  const order = await ordersService.updateStatus(req.params.id, status);
  if (!order) throw new AppError(404, 'not_found', 'Order not found');
  res.json(order);
});

export const invoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  const doc = await ordersService.invoice(userId, req.params.id);
  if (!doc) throw new AppError(404, 'not_found', 'Order not found');
  res.json(doc);
});
