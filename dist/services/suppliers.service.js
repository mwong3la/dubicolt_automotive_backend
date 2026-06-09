"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersService = exports.SuppliersService = void 0;
const store_1 = require("../dubicolt/store");
class SuppliersService {
    create(data) {
        return store_1.dubicoltStore.createSupplier(data);
    }
    list() {
        return store_1.dubicoltStore.listSuppliers();
    }
    update(id, data) {
        return store_1.dubicoltStore.updateSupplier(id, data);
    }
}
exports.SuppliersService = SuppliersService;
exports.suppliersService = new SuppliersService();
