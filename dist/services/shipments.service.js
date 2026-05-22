"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentsService = exports.ShipmentsService = void 0;
const AppError_1 = require("../errors/AppError");
const store_1 = require("../dubiken/store");
class ShipmentsService {
    async getByTrackingId(trackingId) {
        const shipment = await store_1.dubikenStore.getShipment(trackingId);
        if (!shipment)
            throw new AppError_1.AppError(404, 'not_found', 'Shipment not found');
        return shipment;
    }
    async list() {
        return { data: await store_1.dubikenStore.listShipments() };
    }
}
exports.ShipmentsService = ShipmentsService;
exports.shipmentsService = new ShipmentsService();
