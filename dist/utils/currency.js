"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatKshAmount = exports.formatKsh = exports.USD_TO_KES = void 0;
exports.usdToKes = usdToKes;
exports.kesToUsd = kesToUsd;
exports.formatPrice = formatPrice;
exports.formatAmount = formatAmount;
exports.formatKshLabel = formatKshLabel;
exports.formatKshLabelFromKes = formatKshLabelFromKes;
exports.parseKesFromLabel = parseKesFromLabel;
exports.normalizeStoredMoneyLabel = normalizeStoredMoneyLabel;
exports.formatKshFromInput = formatKshFromInput;
exports.formatCompactKes = formatCompactKes;
exports.formatPeriodChange = formatPeriodChange;
exports.productSavePercentKes = productSavePercentKes;
exports.productSavePercent = productSavePercent;
exports.USD_TO_KES = 135;
function usdToKes(usd) {
    if (!Number.isFinite(usd))
        return 0;
    return Math.round(usd * exports.USD_TO_KES);
}
function kesToUsd(kes) {
    if (!Number.isFinite(kes))
        return 0;
    return Math.round((kes / exports.USD_TO_KES) * 100) / 100;
}
function formatPrice(usd) {
    return usdToKes(usd).toLocaleString('en-KE');
}
function formatAmount(kes) {
    return Math.round(kes).toLocaleString('en-KE');
}
function formatKshLabel(usd) {
    return `KSh ${formatPrice(usd)}`;
}
function formatKshLabelFromKes(kes) {
    return `KSh ${formatAmount(kes)}`;
}
/** Parse "KSh 12,500" or similar stored order totals */
function parseKesFromLabel(label) {
    const digits = String(label ?? '').replace(/[^0-9]/g, '');
    const n = parseInt(digits, 10);
    return Number.isFinite(n) ? n : 0;
}
/** Normalize legacy $ labels and bare numbers to a KSh display string. */
function normalizeStoredMoneyLabel(stored) {
    const s = String(stored ?? '').trim();
    if (!s)
        return '';
    if (/^ksh/i.test(s)) {
        const kes = parseKesFromLabel(s);
        return kes > 0 ? formatKshLabelFromKes(kes) : s;
    }
    const numeric = parseFloat(s.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numeric))
        return s;
    const prefix = /^est\.?\s*/i.test(s) ? 'Est. ' : '';
    const kes = s.includes('$') ? usdToKes(numeric) : Math.round(numeric);
    return `${prefix}${formatKshLabelFromKes(kes)}`;
}
/** Format admin/user money input as KSh for storage. */
function formatKshFromInput(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    return normalizeStoredMoneyLabel(trimmed);
}
function formatCompactKes(kes) {
    const n = Math.round(Number(kes) || 0);
    if (n >= 1000000)
        return `KSh ${(n / 1000000).toFixed(1)}M`;
    if (n >= 10000)
        return `KSh ${Math.round(n / 1000)}K`;
    return formatKshLabelFromKes(n);
}
function formatPeriodChange(current, previous) {
    if (previous <= 0 && current <= 0)
        return 'Flat vs prior 28 days';
    if (previous <= 0)
        return 'New sales this period';
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}% vs prior 28 days`;
}
/** Discount % when compare-at price (KES) is above sale price (KES). */
function productSavePercentKes(priceKes, compareAtKes) {
    const price = Math.round(Number(priceKes));
    const compare = compareAtKes != null ? Math.round(Number(compareAtKes)) : NaN;
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(compare) || compare <= price) {
        return null;
    }
    return Math.round((1 - price / compare) * 100);
}
/** @deprecated use productSavePercentKes — kept for legacy USD rows */
function productSavePercent(priceUsd, originalPriceUsd) {
    const price = Number(priceUsd);
    const original = originalPriceUsd != null ? Number(originalPriceUsd) : NaN;
    if (!Number.isFinite(price) || !Number.isFinite(original) || original <= price)
        return null;
    return Math.round((1 - price / original) * 100);
}
/** @deprecated use formatPrice */
exports.formatKsh = formatPrice;
/** @deprecated use formatAmount */
exports.formatKshAmount = formatAmount;
