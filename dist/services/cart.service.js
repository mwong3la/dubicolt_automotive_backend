"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = exports.CartService = void 0;
const AppError_1 = require("../errors/AppError");
const store_1 = require("../dubiken/store");
class CartService {
    async getCart(userId) {
        return store_1.dubikenStore.getCart(userId);
    }
    async addItem(userId, productId, quantity) {
        const cart = await store_1.dubikenStore.addCartItem(userId, productId, quantity);
        if (!cart)
            throw new AppError_1.AppError(404, 'not_found', 'Product not found');
        return cart;
    }
    async updateItem(userId, lineId, quantity) {
        const cart = await store_1.dubikenStore.updateCartItem(userId, lineId, quantity);
        if (!cart)
            throw new AppError_1.AppError(404, 'not_found', 'Cart line not found');
        return cart;
    }
    async removeItem(userId, lineId) {
        return store_1.dubikenStore.removeCartItem(userId, lineId);
    }
    async createShippingCheckout(userId, shipping) {
        return store_1.dubikenStore.createCheckoutShipping(userId, shipping);
    }
    async completeCheckout(checkoutId) {
        const result = await store_1.dubikenStore.completeCheckout(checkoutId);
        if (!result)
            throw new AppError_1.AppError(404, 'not_found', 'Checkout session not found');
        return result;
    }
}
exports.CartService = CartService;
exports.cartService = new CartService();
