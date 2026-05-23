import { AppError } from '../errors/AppError';
import { dubikenStore } from '../dubiken/store';

export class SourcingService {
  getDashboard(userId: string) {
    return dubikenStore.getUserSourcingDashboard(userId);
  }

  createRequest(userId: string, body: Record<string, unknown>) {
    return dubikenStore.createUserSourcingRequest(userId, body);
  }

  async getRequestDetail(id: string) {
    const detail = await dubikenStore.getUserSourcingDetail(id);
    if (!detail) throw new AppError(404, 'not_found', 'Sourcing request not found');
    return detail;
  }

  async listMarketplaceOrders(userId?: string) {
    return { data: await dubikenStore.listUserMarketplaceOrders(userId) };
  }

  async getMarketplaceOrder(userId: string, orderId: string) {
    const detail = await dubikenStore.getUserMarketplaceOrder(userId, orderId);
    if (!detail) throw new AppError(404, 'not_found', 'Order not found');
    return detail;
  }

  listShipments(userId: string) {
    return dubikenStore.listUserShipments(userId);
  }

  async getShipment(userId: string, trackingId: string) {
    const shipment = await dubikenStore.getUserShipment(userId, trackingId);
    if (!shipment) throw new AppError(404, 'not_found', 'Shipment not found');
    return shipment;
  }
}

export const sourcingService = new SourcingService();
