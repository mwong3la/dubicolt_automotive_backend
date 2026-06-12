import { dubicoltStore } from '../dubicolt/store';

export class ReturnsService {
  create(userId: string, data: { orderId: string; reason: string }) {
    return dubicoltStore.createReturnRequest(userId, data);
  }

  list(userId?: string) {
    return dubicoltStore.listReturnRequests(userId);
  }

  update(
    id: string,
    data: { status: 'APPROVED' | 'REJECTED' | 'REFUNDED'; refundAmount?: number; adminNotes?: string },
  ) {
    return dubicoltStore.updateReturnRequest(id, data);
  }
}

export const returnsService = new ReturnsService();
