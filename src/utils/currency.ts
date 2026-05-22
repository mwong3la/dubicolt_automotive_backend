export const USD_TO_KES = 135;

export function usdToKes(usd: number): number {
  if (!Number.isFinite(usd)) return 0;
  return Math.round(usd * USD_TO_KES);
}

export function kesToUsd(kes: number): number {
  if (!Number.isFinite(kes)) return 0;
  return Math.round((kes / USD_TO_KES) * 100) / 100;
}

export function formatPrice(usd: number): string {
  return usdToKes(usd).toLocaleString('en-KE');
}

export function formatAmount(kes: number): string {
  return Math.round(kes).toLocaleString('en-KE');
}

/** @deprecated use formatPrice */
export const formatKsh = formatPrice;
/** @deprecated use formatAmount */
export const formatKshAmount = formatAmount;
