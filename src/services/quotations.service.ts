import { dubicoltStore } from '../dubicolt/store';

export class QuotationsService {
  create(data: {
    requestId: string;
    price: number;
    leadTimeDays: number;
    validUntil: string;
    notes?: string;
    shippingCost?: number;
    supplierId?: string;
  }) {
    return dubicoltStore.createQuotation(data);
  }

  get(id: string) {
    return dubicoltStore.getQuotation(id);
  }

  accept(id: string, userId: string) {
    return dubicoltStore.acceptQuotation(id, userId);
  }

  reject(id: string, userId: string) {
    return dubicoltStore.rejectQuotation(id, userId);
  }
}

export const quotationsService = new QuotationsService();
