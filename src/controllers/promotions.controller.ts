import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { promotionsService } from '../services/promotions.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const list = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(await promotionsService.list());
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, name, type, value, minOrderAmount, active, startsAt, endsAt, maxUses } = req.body ?? {};
  if (!code || !name || !type || value === undefined) {
    throw new AppError(400, 'validation_error', 'code, name, type, and value are required');
  }
  res.status(201).json(
    await promotionsService.create({
      code,
      name,
      type,
      value: Number(value),
      minOrderAmount: minOrderAmount != null ? Number(minOrderAmount) : undefined,
      active,
      startsAt,
      endsAt,
      maxUses: maxUses != null ? Number(maxUses) : undefined,
    }),
  );
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const promo = await promotionsService.update(req.params.id, req.body ?? {});
  if (!promo) throw new AppError(404, 'not_found', 'Promotion not found');
  res.json(promo);
});

export const validate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, subtotal } = req.body ?? {};
  if (!code || subtotal === undefined) {
    throw new AppError(400, 'validation_error', 'code and subtotal are required');
  }
  res.json(await promotionsService.validate(String(code), Number(subtotal)));
});
