import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { partRequestsService } from '../services/part-requests.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vehicle, partName, description, vin, photoUrls } = req.body ?? {};
  if (!vehicle || !partName || !description) {
    throw new AppError(400, 'validation_error', 'vehicle, partName, and description are required');
  }
  res.status(201).json(
    await partRequestsService.create(req.user!.id, { vehicle, partName, description, vin, photoUrls }),
  );
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  res.json(await partRequestsService.list(userId));
});

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  const request = await partRequestsService.get(req.params.id, userId);
  if (!request) throw new AppError(404, 'not_found', 'Part request not found');
  res.json(request);
});
