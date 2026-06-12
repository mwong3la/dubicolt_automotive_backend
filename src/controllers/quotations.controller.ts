import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { quotationsService } from '../services/quotations.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId, price, leadTimeDays, validUntil, notes, shippingCost, supplierId } = req.body ?? {};
  if (!requestId || price == null || !leadTimeDays || !validUntil) {
    throw new AppError(400, 'validation_error', 'requestId, price, leadTimeDays, and validUntil are required');
  }
  res.status(201).json(
    await quotationsService.create({
      requestId,
      price: Number(price),
      leadTimeDays: Number(leadTimeDays),
      validUntil,
      notes,
      shippingCost: shippingCost != null ? Number(shippingCost) : undefined,
      supplierId,
    }),
  );
});

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quote = await quotationsService.get(req.params.id);
  if (!quote) throw new AppError(404, 'not_found', 'Quotation not found');
  res.json(quote);
});

export const accept = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await quotationsService.accept(req.params.id, req.user!.id));
});

export const reject = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await quotationsService.reject(req.params.id, req.user!.id));
});
