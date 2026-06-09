"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.stockOut = exports.stockIn = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const inventory_service_1 = require("../services/inventory.service");
const AppError_1 = require("../errors/AppError");
exports.stockIn = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId, quantity } = req.body ?? {};
    if (!productId || !quantity)
        throw new AppError_1.AppError(400, 'validation_error', 'productId and quantity are required');
    res.json(await inventory_service_1.inventoryService.stockIn(productId, Number(quantity)));
});
exports.stockOut = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId, quantity } = req.body ?? {};
    if (!productId || !quantity)
        throw new AppError_1.AppError(400, 'validation_error', 'productId and quantity are required');
    res.json(await inventory_service_1.inventoryService.stockOut(productId, Number(quantity)));
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await inventory_service_1.inventoryService.list());
});
