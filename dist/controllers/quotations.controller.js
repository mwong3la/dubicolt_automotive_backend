"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reject = exports.accept = exports.get = exports.create = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const quotations_service_1 = require("../services/quotations.service");
const AppError_1 = require("../errors/AppError");
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { requestId, price, leadTimeDays, validUntil, supplierId } = req.body ?? {};
    if (!requestId || !price || !leadTimeDays || !validUntil) {
        throw new AppError_1.AppError(400, 'validation_error', 'requestId, price, leadTimeDays, and validUntil are required');
    }
    res.status(201).json(await quotations_service_1.quotationsService.create({ requestId, price: Number(price), leadTimeDays: Number(leadTimeDays), validUntil, supplierId }));
});
exports.get = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const quote = await quotations_service_1.quotationsService.get(req.params.id);
    if (!quote)
        throw new AppError_1.AppError(404, 'not_found', 'Quotation not found');
    res.json(quote);
});
exports.accept = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await quotations_service_1.quotationsService.accept(req.params.id, req.user.id));
});
exports.reject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await quotations_service_1.quotationsService.reject(req.params.id, req.user.id));
});
