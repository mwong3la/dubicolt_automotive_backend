"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const store_1 = require("../dubicolt/store");
class InventoryService {
    stockIn(productId, quantity) {
        return store_1.dubicoltStore.stockIn(productId, quantity);
    }
    stockOut(productId, quantity) {
        return store_1.dubicoltStore.stockOut(productId, quantity);
    }
    list() {
        return store_1.dubicoltStore.listInventory();
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
