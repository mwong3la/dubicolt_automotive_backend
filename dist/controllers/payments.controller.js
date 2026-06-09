"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callback = exports.stkPush = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const payments_service_1 = require("../services/payments.service");
const AppError_1 = require("../errors/AppError");
exports.stkPush = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId, phone } = req.body ?? {};
    if (!orderId || !phone)
        throw new AppError_1.AppError(400, 'validation_error', 'orderId and phone are required');
    res.json(await payments_service_1.paymentsService.stkPush(orderId, phone));
});
exports.callback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await payments_service_1.paymentsService.callback(req.body ?? {}));
});
