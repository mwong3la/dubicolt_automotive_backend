"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveriesService = exports.DeliveriesService = void 0;
const store_1 = require("../dubicolt/store");
class DeliveriesService {
    create(data) {
        return store_1.dubicoltStore.createDelivery(data);
    }
    updateStatus(id, status, proofUrl) {
        return store_1.dubicoltStore.updateDeliveryStatus(id, status, proofUrl);
    }
    get(id) {
        return store_1.dubicoltStore.getDelivery(id);
    }
}
exports.DeliveriesService = DeliveriesService;
exports.deliveriesService = new DeliveriesService();
