import { AppError } from '../errors/AppError';
import { dubikenStore } from '../dubiken/store';

export class CartService {
  async getCart(userId: string) {
    return dubikenStore.getCart(userId);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await dubikenStore.addCartItem(userId, productId, quantity);
    if (!cart) throw new AppError(404, 'not_found', 'Product not found');
    return cart;
  }

  async updateItem(userId: string, lineId: string, quantity: number) {
    const cart = await dubikenStore.updateCartItem(userId, lineId, quantity);
    if (!cart) throw new AppError(404, 'not_found', 'Cart line not found');
    return cart;
  }

  async removeItem(userId: string, lineId: string) {
    return dubikenStore.removeCartItem(userId, lineId);
  }

  async createShippingCheckout(userId: string, shipping: Record<string, string>) {
    return dubikenStore.createCheckoutShipping(userId, shipping);
  }

  async completeCheckout(checkoutId: string) {
    const result = await dubikenStore.completeCheckout(checkoutId);
    if (!result) throw new AppError(404, 'not_found', 'Checkout session not found');
    return result;
  }

  async completeGuestCheckout(body: {
    items: { product_id: string; quantity: number }[];
    shipping: Record<string, string>;
    payment_method?: string;
  }) {
    const result = await dubikenStore.completeGuestCheckout(body);
    if (!result) throw new AppError(400, 'validation_error', 'Could not place order');
    return result;
  }
}

export const cartService = new CartService();
