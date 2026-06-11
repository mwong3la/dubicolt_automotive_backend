import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { paymentsService } from '../services/payments.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  res.json(await paymentsService.list(userId));
});

export const byOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  const payments = await paymentsService.byOrder(req.params.orderId, userId);
  if (payments === null) throw new AppError(404, 'not_found', 'Order not found');
  res.json(payments);
});

export const stkPush = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, phone } = req.body ?? {};
  if (!orderId || !phone) throw new AppError(400, 'validation_error', 'orderId and phone are required');
  res.json(await paymentsService.stkPush(orderId, phone));
});

export const callback = asyncHandler(async (req, res: Response) => {
  res.json(await paymentsService.callback(req.body ?? {}));
});
