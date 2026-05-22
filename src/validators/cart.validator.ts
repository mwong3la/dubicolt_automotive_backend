import { AppError } from '../errors/AppError';

export function validateAddCartItem(body: Record<string, unknown>): {
  product_id: string;
  quantity: number;
} {
  const product_id = String(body.product_id ?? '');
  const quantity = Number(body.quantity);
  const details: Record<string, string[]> = {};
  if (!product_id) details.product_id = ['product_id is required'];
  if (!quantity || quantity < 1) details.quantity = ['quantity must be at least 1'];
  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }
  return { product_id, quantity };
}

export function validateShipping(body: Record<string, unknown>): Record<string, string> {
  const fields = ['full_name', 'phone', 'address', 'city', 'region'] as const;
  const details: Record<string, string[]> = {};
  const shipping: Record<string, string> = {};
  for (const key of fields) {
    const value = String(body[key] ?? '').trim();
    if (!value) details[key] = ['Required'];
    else shipping[key] = value;
  }
  if (Object.keys(details).length) {
    throw new AppError(400, 'validation_error', 'Validation failed', details);
  }
  return shipping;
}
