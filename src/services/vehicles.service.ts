import { dubicoltStore } from '../dubicolt/store';

export class VehiclesService {
  create(userId: string, data: { make: string; model: string; year: number; engine?: string; vin?: string }) {
    return dubicoltStore.createVehicle(userId, data);
  }

  list(userId: string) {
    return dubicoltStore.listVehicles(userId);
  }

  update(userId: string, id: string, data: Partial<{ make: string; model: string; year: number; engine?: string; vin?: string }>) {
    return dubicoltStore.updateVehicle(userId, id, data);
  }

  delete(userId: string, id: string) {
    return dubicoltStore.deleteVehicle(userId, id);
  }
}

export const vehiclesService = new VehiclesService();
