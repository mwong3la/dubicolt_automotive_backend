import { Op } from 'sequelize';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Lookup by order_number; only match UUID id when the param is a valid UUID. */
export function orderIdWhere(orderId: string): Record<string, unknown> {
  if (UUID_RE.test(orderId)) {
    return { [Op.or]: [{ order_number: orderId }, { id: orderId }] };
  }
  return { order_number: orderId };
}

/** Lookup by request_number; only match UUID id when the param is a valid UUID. */
export function partRequestIdWhere(requestId: string): Record<string, unknown> {
  if (UUID_RE.test(requestId)) {
    return { [Op.or]: [{ request_number: requestId }, { id: requestId }] };
  }
  return { request_number: requestId };
}
