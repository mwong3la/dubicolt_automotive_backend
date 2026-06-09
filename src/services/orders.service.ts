import { dubicoltStore } from '../dubicolt/store';

export class OrdersService {
  list(userId?: string) {
    return dubicoltStore.listOrders(userId);
  }

  get(userId: string | undefined, orderId: string) {
    return dubicoltStore.getOrder(userId, orderId);
  }
}

export const ordersService = new OrdersService();
