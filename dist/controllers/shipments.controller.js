"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByTrackingId = exports.list = void 0;
const shipments_service_1 = require("../services/shipments.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const tracking_id_1 = require("../utils/tracking-id");
exports.list = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await shipments_service_1.shipmentsService.list());
});
exports.getByTrackingId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await shipments_service_1.shipmentsService.getByTrackingId((0, tracking_id_1.normalizeTrackingId)(req.params.trackingId)));
});
