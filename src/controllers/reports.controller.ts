import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { reportsService } from '../services/reports.service';

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await reportsService.dashboard());
});
