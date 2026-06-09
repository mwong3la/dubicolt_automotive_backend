"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.list = exports.create = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const part_requests_service_1 = require("../services/part-requests.service");
const AppError_1 = require("../errors/AppError");
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { vehicle, partName, description, vin, photoUrls } = req.body ?? {};
    if (!vehicle || !partName || !description) {
        throw new AppError_1.AppError(400, 'validation_error', 'vehicle, partName, and description are required');
    }
    res.status(201).json(await part_requests_service_1.partRequestsService.create(req.user.id, { vehicle, partName, description, vin, photoUrls }));
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    res.json(await part_requests_service_1.partRequestsService.list(userId));
});
exports.get = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    const request = await part_requests_service_1.partRequestsService.get(req.params.id, userId);
    if (!request)
        throw new AppError_1.AppError(404, 'not_found', 'Part request not found');
    res.json(request);
});
