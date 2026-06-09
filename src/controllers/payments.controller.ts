import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { paymentsService } from '../services/payments.service';
import { AppError } from '../errors/AppError';

export const stkPush = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, phone } = req.body ?? {};
  if (!orderId || !phone) throw new AppError(400, 'validation_error', 'orderId and phone are required');
  res.json(await paymentsService.stkPush(orderId, phone));
});

export const callback = asyncHandler(async (req: Request, res: Response) => {
  res.json(await paymentsService.callback(req.body ?? {}));
});
