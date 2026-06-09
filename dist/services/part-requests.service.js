"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partRequestsService = exports.PartRequestsService = void 0;
const store_1 = require("../dubicolt/store");
class PartRequestsService {
    create(userId, data) {
        return store_1.dubicoltStore.createPartRequest(userId, data);
    }
    list(userId) {
        return store_1.dubicoltStore.listPartRequests(userId);
    }
    get(id, userId) {
        return store_1.dubicoltStore.getPartRequest(id, userId);
    }
}
exports.PartRequestsService = PartRequestsService;
exports.partRequestsService = new PartRequestsService();
