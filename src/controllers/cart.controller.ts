import { Response } from 'express';
import { cartService } from '../services/cart.service';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateAddCartItem,
  validateGuestCheckout,
  validateShipping,
} from '../validators/cart.validator';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../errors/AppError';

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await cartService.getCart(req.user!.id));
});

export const addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { product_id, quantity } = validateAddCartItem(req.body ?? {});
  res.json(await cartService.addItem(req.user!.id, product_id, quantity));
});

export const updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(
    await cartService.updateItem(req.user!.id, req.params.lineId, Number(req.body?.quantity ?? 0)),
  );
});

export const removeItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await cartService.removeItem(req.user!.id, req.params.lineId));
});

export const checkoutShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shipping = validateShipping(req.body ?? {});
  res.json(await cartService.createShippingCheckout(req.user!.id, shipping));
});

export const guestCheckout = asyncHandler(async (req, res: Response) => {
  const body = validateGuestCheckout(req.body ?? {});
  const result = await cartService.completeGuestCheckout(body);
  res.status(201).json(result);
});

export const checkoutComplete = asyncHandler(async (req: AuthRequest, res: Response) => {
  const checkout_id = String(req.body?.checkout_id ?? '');
  if (!checkout_id) {
    throw new AppError(400, 'validation_error', 'Validation failed', {
      checkout_id: ['checkout_id is required'],
    });
  }
  const result = await cartService.completeCheckout(checkout_id);
  res.status(201).json(result);
});
