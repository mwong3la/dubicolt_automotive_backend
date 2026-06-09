import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { cartService } from '../services/cart.service';
import { AppError } from '../errors/AppError';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await cartService.getCart(req.user!.id));
});

export const addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, quantity } = req.body ?? {};
  if (!productId || !quantity) throw new AppError(400, 'validation_error', 'productId and quantity are required');
  res.status(201).json(await cartService.addItem(req.user!.id, productId, Number(quantity)));
});

export const updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quantity } = req.body ?? {};
  if (quantity === undefined) throw new AppError(400, 'validation_error', 'quantity is required');
  res.json(await cartService.updateItem(req.user!.id, req.params.id, Number(quantity)));
});

export const removeItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await cartService.removeItem(req.user!.id, req.params.id));
});

export const checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deliveryMethod, deliveryAddress } = req.body ?? {};
  if (!deliveryMethod || !deliveryAddress) {
    throw new AppError(400, 'validation_error', 'deliveryMethod and deliveryAddress are required');
  }
  res.json(await cartService.checkout(req.user!.id, { deliveryMethod, deliveryAddress }));
});
