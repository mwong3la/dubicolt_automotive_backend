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
  const fields = ['full_name', 'phone', 'email', 'address', 'city', 'region'] as const;
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

export function validateGuestCheckout(body: Record<string, unknown>): {
  items: { product_id: string; quantity: number }[];
  shipping: Record<string, string>;
  payment_method: string;
} {
  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError(400, 'validation_error', 'Validation failed', {
      items: ['At least one cart item is required'],
    });
  }
  const items = rawItems.map((row, index) => {
    const product_id = String((row as Record<string, unknown>).product_id ?? '');
    const quantity = Number((row as Record<string, unknown>).quantity);
    if (!product_id) {
      throw new AppError(400, 'validation_error', 'Validation failed', {
        [`items[${index}].product_id`]: ['product_id is required'],
      });
    }
    if (!quantity || quantity < 1) {
      throw new AppError(400, 'validation_error', 'Validation failed', {
        [`items[${index}].quantity`]: ['quantity must be at least 1'],
      });
    }
    return { product_id, quantity };
  });
  const shipping = validateShipping(
    (body.shipping as Record<string, unknown> | undefined) ?? {},
  );
  const payment_method = String(body.payment_method ?? 'card');
  return { items, shipping, payment_method };
}
