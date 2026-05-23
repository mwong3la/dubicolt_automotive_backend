import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { parseIntQuery, parseStatuses } from '../utils/query';
import { validateOfficialQuote } from '../validators/sourcing.validator';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await adminService.getDashboard());
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await adminService.getAnalytics());
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await adminService.listCategories());
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await adminService.getCategory(req.params.id));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const cat = await adminService.upsertCategory(req.body);
  res.status(201).json(cat);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await adminService.upsertCategory({ ...req.body, id: req.params.id }));
});

export const getInventoryKpis = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await adminService.getInventoryKpis());
});

export const syncStorefront = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await adminService.syncStorefront());
});

export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    await adminService.listInventory({
      search: req.query.search as string | undefined,
      page: parseIntQuery(req.query.page, 1),
      page_size: parseIntQuery(req.query.page_size, 20),
    }),
  );
});

export const getInventoryProduct = asyncHandler(async (req: Request, res: Response) => {
  res.json(await adminService.getInventoryProduct(req.params.id));
});

export const createInventoryProduct = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await adminService.createProduct(req.body));
});

export const updateInventoryProduct = asyncHandler(async (req: Request, res: Response) => {
  res.json(await adminService.updateProduct(req.params.id, req.body));
});

export const listSourcingRequests = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    await adminService.listSourcingRequests({
      market: (req.query.market as string) || undefined,
      status: parseStatuses(req.query.status as string | string[] | undefined),
      page: parseIntQuery(req.query.page, 1),
      page_size: parseIntQuery(req.query.page_size, 10),
    }),
  );
});

export const getSourcingDetail = asyncHandler(async (req: Request, res: Response) => {
  res.json(await adminService.getSourcingDetail(req.params.id));
});

export const saveOfficialQuote = asyncHandler(async (req: Request, res: Response) => {
  const body = validateOfficialQuote(req.body ?? {});
  res.json(await adminService.saveOfficialQuote(req.params.id, body));
});

export const listOrders = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await adminService.listOrders());
});

export const updateMarketplaceOrder = asyncHandler(async (req: Request, res: Response) => {
  const status = String(req.body?.status ?? '').trim();
  if (!status) {
    throw new AppError(400, 'validation_error', 'status is required', {
      status: ['status is required'],
    });
  }
  res.json(await adminService.updateMarketplaceOrderStatus(req.params.id, status));
});
