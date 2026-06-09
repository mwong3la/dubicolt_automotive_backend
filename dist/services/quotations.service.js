"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationsService = exports.QuotationsService = void 0;
const store_1 = require("../dubicolt/store");
class QuotationsService {
    create(data) {
        return store_1.dubicoltStore.createQuotation(data);
    }
    get(id) {
        return store_1.dubicoltStore.getQuotation(id);
    }
    accept(id, userId) {
        return store_1.dubicoltStore.acceptQuotation(id, userId);
    }
    reject(id, userId) {
        return store_1.dubicoltStore.rejectQuotation(id, userId);
    }
}
exports.QuotationsService = QuotationsService;
exports.quotationsService = new QuotationsService();
