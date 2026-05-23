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

export function formatKshLabel(usd: number): string {
  return `KSh ${formatPrice(usd)}`;
}

export function formatKshLabelFromKes(kes: number): string {
  return `KSh ${formatAmount(kes)}`;
}

/** Parse "KSh 12,500" or similar stored order totals */
export function parseKesFromLabel(label: string): number {
  const digits = String(label ?? '').replace(/[^0-9]/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Normalize legacy $ labels and bare numbers to a KSh display string. */
export function normalizeStoredMoneyLabel(stored: string | null | undefined): string {
  const s = String(stored ?? '').trim();
  if (!s) return '';
  if (/^ksh/i.test(s)) {
    const kes = parseKesFromLabel(s);
    return kes > 0 ? formatKshLabelFromKes(kes) : s;
  }
  const numeric = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) return s;
  const prefix = /^est\.?\s*/i.test(s) ? 'Est. ' : '';
  const kes = s.includes('$') ? usdToKes(numeric) : Math.round(numeric);
  return `${prefix}${formatKshLabelFromKes(kes)}`;
}

/** Format admin/user money input as KSh for storage. */
export function formatKshFromInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return normalizeStoredMoneyLabel(trimmed);
}

export function formatCompactKes(kes: number): string {
  const n = Math.round(Number(kes) || 0);
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `KSh ${Math.round(n / 1_000)}K`;
  return formatKshLabelFromKes(n);
}

export function formatPeriodChange(current: number, previous: number): string {
  if (previous <= 0 && current <= 0) return 'Flat vs prior 28 days';
  if (previous <= 0) return 'New sales this period';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}% vs prior 28 days`;
}

/** Discount % when compare-at price (KES) is above sale price (KES). */
export function productSavePercentKes(
  priceKes: number,
  compareAtKes: number | null | undefined,
): number | null {
  const price = Math.round(Number(priceKes));
  const compare = compareAtKes != null ? Math.round(Number(compareAtKes)) : NaN;
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(compare) || compare <= price) {
    return null;
  }
  return Math.round((1 - price / compare) * 100);
}

/** @deprecated use productSavePercentKes — kept for legacy USD rows */
export function productSavePercent(
  priceUsd: number,
  originalPriceUsd: number | null | undefined,
): number | null {
  const price = Number(priceUsd);
  const original = originalPriceUsd != null ? Number(originalPriceUsd) : NaN;
  if (!Number.isFinite(price) || !Number.isFinite(original) || original <= price) return null;
  return Math.round((1 - price / original) * 100);
}

/** @deprecated use formatPrice */
export const formatKsh = formatPrice;
/** @deprecated use formatAmount */
export const formatKshAmount = formatAmount;
