import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { productsService } from '../services/products.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body ?? {};
  if (!body.title || !body.sku || !body.sellingPrice) {
    throw new AppError(400, 'validation_error', 'title, sku, and sellingPrice are required');
  }
  res.status(201).json(await productsService.create(body));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await productsService.list());
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.get(req.params.id);
  if (!product) throw new AppError(404, 'not_found', 'Product not found');
  res.json(product);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.update(req.params.id, req.body ?? {});
  if (!product) throw new AppError(404, 'not_found', 'Product not found');
  res.json(product);
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { keyword, make, model, year, engine, vehicleId, category, brand } = req.query;
  res.json(
    await productsService.search({
      keyword: keyword as string | undefined,
      make: make as string | undefined,
      model: model as string | undefined,
      year: year ? Number(year) : undefined,
      engine: engine as string | undefined,
      vehicleId: vehicleId as string | undefined,
      userId: req.user?.id,
      category: category as string | undefined,
      brand: brand as string | undefined,
    }),
  );
});
