"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mvpOrdersService = exports.MvpOrdersService = void 0;
const store_1 = require("../dubicolt/store");
class MvpOrdersService {
    list(userId) {
        return store_1.dubicoltStore.listOrders(userId);
    }
    get(userId, orderId) {
        return store_1.dubicoltStore.getOrder(userId, orderId);
    }
}
exports.MvpOrdersService = MvpOrdersService;
exports.mvpOrdersService = new MvpOrdersService();
