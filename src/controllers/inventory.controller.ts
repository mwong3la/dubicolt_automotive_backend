import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { inventoryService } from '../services/inventory.service';
import { AppError } from '../errors/AppError';

export const stockIn = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body ?? {};
  if (!productId || !quantity) throw new AppError(400, 'validation_error', 'productId and quantity are required');
  res.json(await inventoryService.stockIn(productId, Number(quantity)));
});

export const stockOut = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body ?? {};
  if (!productId || !quantity) throw new AppError(400, 'validation_error', 'productId and quantity are required');
  res.json(await inventoryService.stockOut(productId, Number(quantity)));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await inventoryService.list());
});
