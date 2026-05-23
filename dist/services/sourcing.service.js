"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourcingService = exports.SourcingService = void 0;
const AppError_1 = require("../errors/AppError");
const store_1 = require("../dubiken/store");
class SourcingService {
    getDashboard(userId) {
        return store_1.dubikenStore.getUserSourcingDashboard(userId);
    }
    createRequest(userId, body) {
        return store_1.dubikenStore.createUserSourcingRequest(userId, body);
    }
    async getRequestDetail(id) {
        const detail = await store_1.dubikenStore.getUserSourcingDetail(id);
        if (!detail)
            throw new AppError_1.AppError(404, 'not_found', 'Sourcing request not found');
        return detail;
    }
    async listMarketplaceOrders(userId) {
        return { data: await store_1.dubikenStore.listUserMarketplaceOrders(userId) };
    }
    async getMarketplaceOrder(userId, orderId) {
        const detail = await store_1.dubikenStore.getUserMarketplaceOrder(userId, orderId);
        if (!detail)
            throw new AppError_1.AppError(404, 'not_found', 'Order not found');
        return detail;
    }
    listShipments(userId) {
        return store_1.dubikenStore.listUserShipments(userId);
    }
    async getShipment(userId, trackingId) {
        const shipment = await store_1.dubikenStore.getUserShipment(userId, trackingId);
        if (!shipment)
            throw new AppError_1.AppError(404, 'not_found', 'Shipment not found');
        return shipment;
    }
}
exports.SourcingService = SourcingService;
exports.sourcingService = new SourcingService();
