"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShipment = exports.listShipments = exports.getMarketplaceOrder = exports.listMarketplaceOrders = exports.getRequestDetail = exports.createRequest = exports.getDashboard = void 0;
const sourcing_service_1 = require("../services/sourcing.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const sourcing_validator_1 = require("../validators/sourcing.validator");
const tracking_id_1 = require("../utils/tracking-id");
exports.getDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await sourcing_service_1.sourcingService.getDashboard(req.user.id));
});
exports.createRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const body = (0, sourcing_validator_1.validateCreateSourcingRequest)(req.body ?? {});
    const item = await sourcing_service_1.sourcingService.createRequest(req.user.id, body);
    res.status(201).json(item);
});
exports.getRequestDetail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await sourcing_service_1.sourcingService.getRequestDetail(req.params.id));
});
exports.listMarketplaceOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await sourcing_service_1.sourcingService.listMarketplaceOrders(req.user?.id));
});
exports.getMarketplaceOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await sourcing_service_1.sourcingService.getMarketplaceOrder(req.user.id, req.params.id));
});
exports.listShipments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await sourcing_service_1.sourcingService.listShipments(req.user.id);
    res.json({ data });
});
exports.getShipment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await sourcing_service_1.sourcingService.getShipment(req.user.id, (0, tracking_id_1.normalizeTrackingId)(req.params.trackingId)));
});
