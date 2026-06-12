import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { returnsService } from '../services/returns.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, reason } = req.body ?? {};
  if (!orderId || !reason?.trim()) {
    throw new AppError(400, 'validation_error', 'orderId and reason are required');
  }
  res.status(201).json(await returnsService.create(req.user!.id, { orderId, reason }));
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  res.json(await returnsService.list(userId));
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, refundAmount, adminNotes } = req.body ?? {};
  if (!status) throw new AppError(400, 'validation_error', 'status is required');
  const row = await returnsService.update(req.params.id, {
    status,
    refundAmount: refundAmount != null ? Number(refundAmount) : undefined,
    adminNotes,
  });
  if (!row) throw new AppError(404, 'not_found', 'Return request not found');
  res.json(row);
});
