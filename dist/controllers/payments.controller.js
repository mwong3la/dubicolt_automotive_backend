"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callback = exports.stkPush = exports.byOrder = exports.list = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const payments_service_1 = require("../services/payments.service");
const AppError_1 = require("../errors/AppError");
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    res.json(await payments_service_1.paymentsService.list(userId));
});
exports.byOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    const payments = await payments_service_1.paymentsService.byOrder(req.params.orderId, userId);
    if (payments === null)
        throw new AppError_1.AppError(404, 'not_found', 'Order not found');
    res.json(payments);
});
exports.stkPush = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId, phone } = req.body ?? {};
    if (!orderId || !phone)
        throw new AppError_1.AppError(400, 'validation_error', 'orderId and phone are required');
    res.json(await payments_service_1.paymentsService.stkPush(orderId, phone));
});
exports.callback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await payments_service_1.paymentsService.callback(req.body ?? {}));
});
