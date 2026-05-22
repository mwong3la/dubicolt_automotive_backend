import { Request, Response } from 'express';
import { shipmentsService } from '../services/shipments.service';
import { asyncHandler } from '../utils/asyncHandler';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await shipmentsService.list());
});

export const getByTrackingId = asyncHandler(async (req: Request, res: Response) => {
  res.json(await shipmentsService.getByTrackingId(req.params.trackingId));
});
