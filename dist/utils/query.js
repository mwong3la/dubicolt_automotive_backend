"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStatuses = parseStatuses;
exports.parseIntQuery = parseIntQuery;
function parseStatuses(raw) {
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw.flatMap((s) => s.split(','));
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
function parseIntQuery(value, fallback) {
    const n = parseInt(String(value ?? fallback), 10);
    return Number.isFinite(n) ? n : fallback;
}
