"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsService = exports.PaymentsService = void 0;
const store_1 = require("../dubicolt/store");
class PaymentsService {
    stkPush(orderId, phone) {
        return store_1.dubicoltStore.initiateMpesaStkPush(orderId, phone);
    }
    callback(payload) {
        return store_1.dubicoltStore.handleMpesaCallback(payload);
    }
}
exports.PaymentsService = PaymentsService;
exports.paymentsService = new PaymentsService();
