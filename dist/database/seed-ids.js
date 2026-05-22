"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sid = void 0;
exports.seedUuid = seedUuid;
const uuid_1 = require("uuid");
/** Stable namespace — same seed keys always produce the same UUIDs. */
const SEED_NAMESPACE = 'a3f2c8e1-4b5d-6e7f-8091-a2b3c4d5e6f7';
function seedUuid(scope, key) {
    return (0, uuid_1.v5)(`${scope}:${key}`, SEED_NAMESPACE);
}
exports.sid = {
    user: (key) => seedUuid('user', key),
    product: (key) => seedUuid('product', key),
    category: (key) => seedUuid('category', key),
    sourcing: (key) => seedUuid('sourcing', key),
    shipment: (key) => seedUuid('shipment', key),
    marketplaceOrder: (key) => seedUuid('morder', key),
    adminOrder: (key) => seedUuid('aorder', key),
};
