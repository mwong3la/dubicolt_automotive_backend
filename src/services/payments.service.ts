import { dubicoltStore } from '../dubicolt/store';

export class PaymentsService {
  list(userId?: string) {
    return dubicoltStore.listPayments(userId);
  }

  byOrder(orderId: string, userId?: string) {
    return dubicoltStore.getPaymentsForOrder(orderId, userId);
  }

  stkPush(orderId: string, phone: string) {
    return dubicoltStore.initiateMpesaStkPush(orderId, phone);
  }

  callback(payload: Record<string, unknown>) {
    return dubicoltStore.handleMpesaCallback(payload);
  }
}

export const paymentsService = new PaymentsService();
