import { dubicoltStore } from '../dubicolt/store';

export class MvpOrdersService {
  list(userId?: string) {
    return dubicoltStore.listOrders(userId);
  }

  get(userId: string | undefined, orderId: string) {
    return dubicoltStore.getOrder(userId, orderId);
  }
}

export const mvpOrdersService = new MvpOrdersService();
