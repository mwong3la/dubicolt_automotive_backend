"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTrackingId = normalizeTrackingId;
/** Strip display prefixes (e.g. `#DBK-123`) before DB / URL lookup. */
function normalizeTrackingId(input) {
    return input.trim().replace(/^#+/, '').trim();
}
