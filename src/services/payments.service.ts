import { dubicoltStore } from '../dubicolt/store';

export class PaymentsService {
  stkPush(orderId: string, phone: string) {
    return dubicoltStore.initiateMpesaStkPush(orderId, phone);
  }

  callback(payload: Record<string, unknown>) {
    return dubicoltStore.handleMpesaCallback(payload);
  }
}

export const paymentsService = new PaymentsService();
