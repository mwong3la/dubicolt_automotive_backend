import { v5 as uuidv5 } from 'uuid';

/** Stable namespace — same seed keys always produce the same UUIDs. */
const SEED_NAMESPACE = 'a3f2c8e1-4b5d-6e7f-8091-a2b3c4d5e6f7';

export function seedUuid(scope: string, key: string): string {
  return uuidv5(`${scope}:${key}`, SEED_NAMESPACE);
}

export const sid = {
  user: (key: string) => seedUuid('user', key),
  product: (key: string) => seedUuid('product', key),
  category: (key: string) => seedUuid('category', key),
  sourcing: (key: string) => seedUuid('sourcing', key),
  shipment: (key: string) => seedUuid('shipment', key),
  marketplaceOrder: (key: string) => seedUuid('morder', key),
  adminOrder: (key: string) => seedUuid('aorder', key),
};
