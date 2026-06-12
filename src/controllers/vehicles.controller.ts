import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { vehiclesService } from '../services/vehicles.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const catalog = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(await vehiclesService.catalog());
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { make, model, year, engine } = req.body ?? {};
  if (!make || !model || !year) throw new AppError(400, 'validation_error', 'make, model, and year are required');
  res.status(201).json(await vehiclesService.create(req.user!.id, { make, model, year: Number(year), engine }));
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await vehiclesService.list(req.user!.id));
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await vehiclesService.update(req.user!.id, req.params.id, req.body ?? {});
  if (!result) throw new AppError(404, 'not_found', 'Vehicle not found');
  res.json(result);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ok = await vehiclesService.delete(req.user!.id, req.params.id);
  if (!ok) throw new AppError(404, 'not_found', 'Vehicle not found');
  res.status(204).send();
});
