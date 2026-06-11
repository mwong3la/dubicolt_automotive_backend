import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { categoriesService } from '../services/categories.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const list = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(await categoriesService.list());
});

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await categoriesService.get(req.params.id);
  if (!row) throw new AppError(404, 'not_found', 'Category not found');
  res.json(row);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await categoriesService.create(req.body);
  res.status(201).json(row);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await categoriesService.update(req.params.id, req.body);
  if (!row) throw new AppError(404, 'not_found', 'Category not found');
  res.json(row);
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ok = await categoriesService.delete(req.params.id);
  if (!ok) throw new AppError(404, 'not_found', 'Category not found');
  res.status(204).send();
});

export { deleteCategory as delete };
