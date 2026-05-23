"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddCartItem = validateAddCartItem;
exports.validateShipping = validateShipping;
exports.validateGuestCheckout = validateGuestCheckout;
const AppError_1 = require("../errors/AppError");
function validateAddCartItem(body) {
    const product_id = String(body.product_id ?? '');
    const quantity = Number(body.quantity);
    const details = {};
    if (!product_id)
        details.product_id = ['product_id is required'];
    if (!quantity || quantity < 1)
        details.quantity = ['quantity must be at least 1'];
    if (Object.keys(details).length) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', details);
    }
    return { product_id, quantity };
}
function validateShipping(body) {
    const fields = ['full_name', 'phone', 'email', 'address', 'city', 'region'];
    const details = {};
    const shipping = {};
    for (const key of fields) {
        const value = String(body[key] ?? '').trim();
        if (!value)
            details[key] = ['Required'];
        else
            shipping[key] = value;
    }
    if (Object.keys(details).length) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', details);
    }
    return shipping;
}
function validateGuestCheckout(body) {
    const rawItems = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', {
            items: ['At least one cart item is required'],
        });
    }
    const items = rawItems.map((row, index) => {
        const product_id = String(row.product_id ?? '');
        const quantity = Number(row.quantity);
        if (!product_id) {
            throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', {
                [`items[${index}].product_id`]: ['product_id is required'],
            });
        }
        if (!quantity || quantity < 1) {
            throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', {
                [`items[${index}].quantity`]: ['quantity must be at least 1'],
            });
        }
        return { product_id, quantity };
    });
    const shipping = validateShipping(body.shipping ?? {});
    const payment_method = String(body.payment_method ?? 'card');
    return { items, shipping, payment_method };
}
