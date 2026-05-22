import { AppError } from '../errors/AppError';
import { dubikenStore } from '../dubiken/store';

export class ShipmentsService {
  async getByTrackingId(trackingId: string) {
    const shipment = await dubikenStore.getShipment(trackingId);
    if (!shipment) throw new AppError(404, 'not_found', 'Shipment not found');
    return shipment;
  }

  async list() {
    return { data: await dubikenStore.listShipments() };
  }
}

export const shipmentsService = new ShipmentsService();
