"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.list = exports.create = exports.catalog = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const vehicles_service_1 = require("../services/vehicles.service");
const AppError_1 = require("../errors/AppError");
exports.catalog = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await vehicles_service_1.vehiclesService.catalog());
});
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { make, model, year, engine } = req.body ?? {};
    if (!make || !model || !year)
        throw new AppError_1.AppError(400, 'validation_error', 'make, model, and year are required');
    res.status(201).json(await vehicles_service_1.vehiclesService.create(req.user.id, { make, model, year: Number(year), engine }));
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await vehicles_service_1.vehiclesService.list(req.user.id));
});
exports.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await vehicles_service_1.vehiclesService.update(req.user.id, req.params.id, req.body ?? {});
    if (!result)
        throw new AppError_1.AppError(404, 'not_found', 'Vehicle not found');
    res.json(result);
});
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ok = await vehicles_service_1.vehiclesService.delete(req.user.id, req.params.id);
    if (!ok)
        throw new AppError_1.AppError(404, 'not_found', 'Vehicle not found');
    res.status(204).send();
});
