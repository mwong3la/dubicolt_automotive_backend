"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatKshAmount = exports.formatKsh = exports.USD_TO_KES = void 0;
exports.usdToKes = usdToKes;
exports.kesToUsd = kesToUsd;
exports.formatPrice = formatPrice;
exports.formatAmount = formatAmount;
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
/** @deprecated use formatPrice */
exports.formatKsh = formatPrice;
/** @deprecated use formatAmount */
exports.formatKshAmount = formatAmount;
