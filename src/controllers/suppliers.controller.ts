import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { suppliersService } from '../services/suppliers.service';
import { AppError } from '../errors/AppError';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, email } = req.body ?? {};
  if (!name) throw new AppError(400, 'validation_error', 'name is required');
  res.status(201).json(await suppliersService.create({ name, phone, email }));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await suppliersService.list());
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await suppliersService.update(req.params.id, req.body ?? {});
  if (!supplier) throw new AppError(404, 'not_found', 'Supplier not found');
  res.json(supplier);
});
