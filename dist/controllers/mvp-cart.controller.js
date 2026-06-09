"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkout = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const mvp_cart_service_1 = require("../services/mvp-cart.service");
const AppError_1 = require("../errors/AppError");
exports.getCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await mvp_cart_service_1.mvpCartService.getCart(req.user.id));
});
exports.addItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId, quantity } = req.body ?? {};
    if (!productId || !quantity)
        throw new AppError_1.AppError(400, 'validation_error', 'productId and quantity are required');
    res.status(201).json(await mvp_cart_service_1.mvpCartService.addItem(req.user.id, productId, Number(quantity)));
});
exports.updateItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { quantity } = req.body ?? {};
    if (quantity === undefined)
        throw new AppError_1.AppError(400, 'validation_error', 'quantity is required');
    res.json(await mvp_cart_service_1.mvpCartService.updateItem(req.user.id, req.params.id, Number(quantity)));
});
exports.removeItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await mvp_cart_service_1.mvpCartService.removeItem(req.user.id, req.params.id));
});
exports.checkout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { deliveryMethod, deliveryAddress } = req.body ?? {};
    if (!deliveryMethod || !deliveryAddress) {
        throw new AppError_1.AppError(400, 'validation_error', 'deliveryMethod and deliveryAddress are required');
    }
    res.json(await mvp_cart_service_1.mvpCartService.checkout(req.user.id, { deliveryMethod, deliveryAddress }));
});
