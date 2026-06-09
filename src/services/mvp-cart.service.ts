import { dubicoltStore } from '../dubicolt/store';

export class MvpCartService {
  getCart(userId: string) {
    return dubicoltStore.getCart(userId);
  }

  addItem(userId: string, productId: string, quantity: number) {
    return dubicoltStore.addCartItem(userId, productId, quantity);
  }

  updateItem(userId: string, itemId: string, quantity: number) {
    return dubicoltStore.updateCartItem(userId, itemId, quantity);
  }

  removeItem(userId: string, itemId: string) {
    return dubicoltStore.removeCartItem(userId, itemId);
  }

  checkout(userId: string, data: { deliveryMethod: string; deliveryAddress: string }) {
    return dubicoltStore.checkout(userId, data);
  }
}

export const mvpCartService = new MvpCartService();
