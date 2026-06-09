import { dubicoltStore } from '../dubicolt/store';

export class DeliveriesService {
  create(data: { orderId: string; notes?: string }) {
    return dubicoltStore.createDelivery(data);
  }

  updateStatus(id: string, status: string) {
    return dubicoltStore.updateDeliveryStatus(id, status);
  }

  get(id: string) {
    return dubicoltStore.getDelivery(id);
  }
}

export const deliveriesService = new DeliveriesService();
