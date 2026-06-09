"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mvpProductsService = exports.MvpProductsService = void 0;
const store_1 = require("../dubicolt/store");
class MvpProductsService {
    create(data) {
        return store_1.dubicoltStore.createProduct(data);
    }
    list() {
        return store_1.dubicoltStore.listProducts();
    }
    get(id) {
        return store_1.dubicoltStore.getProduct(id);
    }
    update(id, data) {
        return store_1.dubicoltStore.updateProduct(id, data);
    }
    search(filters) {
        return store_1.dubicoltStore.searchProducts(filters);
    }
}
exports.MvpProductsService = MvpProductsService;
exports.mvpProductsService = new MvpProductsService();
