"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.list = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const mvp_orders_service_1 = require("../services/mvp-orders.service");
const AppError_1 = require("../errors/AppError");
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    res.json(await mvp_orders_service_1.mvpOrdersService.list(userId));
});
exports.get = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    const order = await mvp_orders_service_1.mvpOrdersService.get(userId, req.params.id);
    if (!order)
        throw new AppError_1.AppError(404, 'not_found', 'Order not found');
    res.json(order);
});
