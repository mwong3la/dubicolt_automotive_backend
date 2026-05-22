import { Request, Response } from 'express';
import { productsService } from '../services/products.service';
import { asyncHandler } from '../utils/asyncHandler';
import { parseIntQuery } from '../utils/query';

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productsService.getById(req.params.id));
});

export const getRelated = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(20, parseIntQuery(req.query.limit, 4));
  res.json(await productsService.getRelated(req.params.id, limit));
});

export const listMarketplace = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    await productsService.listMarketplace({
      hub: req.query.hub as string | undefined,
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      page: parseIntQuery(req.query.page, 1),
      page_size: parseIntQuery(req.query.page_size, 24),
    }),
  );
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    await productsService.listCategories(
      parseIntQuery(req.query.page, 1),
      parseIntQuery(req.query.page_size, 12),
    ),
  );
});

export const getHomeFeed = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await productsService.getHomeFeed());
});
