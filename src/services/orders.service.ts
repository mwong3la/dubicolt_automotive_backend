import { dubicoltStore } from '../dubicolt/store';

export class OrdersService {
  list(userId?: string) {
    return dubicoltStore.listOrders(userId);
  }

  get(userId: string | undefined, orderId: string) {
    return dubicoltStore.getOrder(userId, orderId);
  }

  updateStatus(orderId: string, status: string, paymentNote?: string) {
    return dubicoltStore.updateOrderStatus(orderId, status, paymentNote);
  }

  invoice(userId: string | undefined, orderId: string) {
    return dubicoltStore.getOrderInvoice(userId, orderId);
  }
}

export const ordersService = new OrdersService();
