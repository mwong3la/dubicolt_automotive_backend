import { dubicoltStore } from '../dubicolt/store';

export class PartRequestsService {
  create(
    userId: string,
    data: {
      vehicle: { make: string; model: string; year: number };
      partName: string;
      description: string;
      photoUrls?: string[];
      urgency?: 'standard' | 'express';
    },
  ) {
    return dubicoltStore.createPartRequest(userId, data);
  }

  list(userId?: string) {
    return dubicoltStore.listPartRequests(userId);
  }

  get(id: string, userId?: string) {
    return dubicoltStore.getPartRequest(id, userId);
  }
}

export const partRequestsService = new PartRequestsService();
