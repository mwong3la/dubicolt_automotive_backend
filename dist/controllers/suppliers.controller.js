"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.list = exports.create = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const suppliers_service_1 = require("../services/suppliers.service");
const AppError_1 = require("../errors/AppError");
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, phone, email } = req.body ?? {};
    if (!name)
        throw new AppError_1.AppError(400, 'validation_error', 'name is required');
    res.status(201).json(await suppliers_service_1.suppliersService.create({ name, phone, email }));
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await suppliers_service_1.suppliersService.list());
});
exports.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const supplier = await suppliers_service_1.suppliersService.update(req.params.id, req.body ?? {});
    if (!supplier)
        throw new AppError_1.AppError(404, 'not_found', 'Supplier not found');
    res.json(supplier);
});
