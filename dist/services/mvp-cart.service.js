"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mvpCartService = exports.MvpCartService = void 0;
const store_1 = require("../dubicolt/store");
class MvpCartService {
    getCart(userId) {
        return store_1.dubicoltStore.getCart(userId);
    }
    addItem(userId, productId, quantity) {
        return store_1.dubicoltStore.addCartItem(userId, productId, quantity);
    }
    updateItem(userId, itemId, quantity) {
        return store_1.dubicoltStore.updateCartItem(userId, itemId, quantity);
    }
    removeItem(userId, itemId) {
        return store_1.dubicoltStore.removeCartItem(userId, itemId);
    }
    checkout(userId, data) {
        return store_1.dubicoltStore.checkout(userId, data);
    }
}
exports.MvpCartService = MvpCartService;
exports.mvpCartService = new MvpCartService();
