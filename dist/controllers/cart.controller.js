"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutComplete = exports.checkoutShipping = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const cart_service_1 = require("../services/cart.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const cart_validator_1 = require("../validators/cart.validator");
const AppError_1 = require("../errors/AppError");
exports.getCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await cart_service_1.cartService.getCart(req.user.id));
});
exports.addItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { product_id, quantity } = (0, cart_validator_1.validateAddCartItem)(req.body ?? {});
    res.json(await cart_service_1.cartService.addItem(req.user.id, product_id, quantity));
});
exports.updateItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await cart_service_1.cartService.updateItem(req.user.id, req.params.lineId, Number(req.body?.quantity ?? 0)));
});
exports.removeItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await cart_service_1.cartService.removeItem(req.user.id, req.params.lineId));
});
exports.checkoutShipping = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shipping = (0, cart_validator_1.validateShipping)(req.body ?? {});
    res.json(await cart_service_1.cartService.createShippingCheckout(req.user.id, shipping));
});
exports.checkoutComplete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const checkout_id = String(req.body?.checkout_id ?? '');
    if (!checkout_id) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', {
            checkout_id: ['checkout_id is required'],
        });
    }
    const result = await cart_service_1.cartService.completeCheckout(checkout_id);
    res.status(201).json(result);
});
