import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { deliveriesService } from '../services/deliveries.service';
import { AppError } from '../errors/AppError';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, notes } = req.body ?? {};
  if (!orderId) throw new AppError(400, 'validation_error', 'orderId is required');
  res.status(201).json(await deliveriesService.create({ orderId, notes }));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body ?? {};
  if (!status) throw new AppError(400, 'validation_error', 'status is required');
  res.json(await deliveriesService.updateStatus(req.params.id, status));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveriesService.get(req.params.id);
  if (!delivery) throw new AppError(404, 'not_found', 'Delivery not found');
  res.json(delivery);
});
