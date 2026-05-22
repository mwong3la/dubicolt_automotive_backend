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

  listShipments(userId: string) {
    return dubikenStore.listUserShipments(userId);
  }
}

export const sourcingService = new SourcingService();
