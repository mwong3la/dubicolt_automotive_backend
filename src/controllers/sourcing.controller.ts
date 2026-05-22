import { Response } from 'express';
import { sourcingService } from '../services/sourcing.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validateCreateSourcingRequest } from '../validators/sourcing.validator';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await sourcingService.getDashboard(req.user!.id));
});

export const createRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = validateCreateSourcingRequest(req.body ?? {});
  const item = await sourcingService.createRequest(req.user!.id, body);
  res.status(201).json(item);
});

export const getRequestDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await sourcingService.getRequestDetail(req.params.id));
});

export const listMarketplaceOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await sourcingService.listMarketplaceOrders(req.user?.id));
});

export const listShipments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await sourcingService.listShipments(req.user!.id);
  res.json({ data });
});
