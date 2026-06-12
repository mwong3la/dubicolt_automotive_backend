"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.get = exports.updateStatus = exports.create = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const deliveries_service_1 = require("../services/deliveries.service");
const AppError_1 = require("../errors/AppError");
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId, notes } = req.body ?? {};
    if (!orderId)
        throw new AppError_1.AppError(400, 'validation_error', 'orderId is required');
    res.status(201).json(await deliveries_service_1.deliveriesService.create({ orderId, notes }));
});
exports.updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, proofUrl } = req.body ?? {};
    if (!status)
        throw new AppError_1.AppError(400, 'validation_error', 'status is required');
    res.json(await deliveries_service_1.deliveriesService.updateStatus(req.params.id, status, proofUrl));
});
exports.get = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const delivery = await deliveries_service_1.deliveriesService.get(req.params.id);
    if (!delivery)
        throw new AppError_1.AppError(404, 'not_found', 'Delivery not found');
    res.json(delivery);
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await deliveries_service_1.deliveriesService.list());
});
