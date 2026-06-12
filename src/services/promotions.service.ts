import { dubicoltStore } from '../dubicolt/store';

export class PromotionsService {
  list() {
    return dubicoltStore.listPromotions();
  }

  create(data: {
    code: string;
    name: string;
    type: 'percent' | 'fixed';
    value: number;
    minOrderAmount?: number;
    active?: boolean;
    startsAt?: string;
    endsAt?: string;
    maxUses?: number;
  }) {
    return dubicoltStore.createPromotion(data);
  }

  update(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      type: 'percent' | 'fixed';
      value: number;
      minOrderAmount: number;
      active: boolean;
      startsAt: string;
      endsAt: string;
      maxUses: number;
    }>,
  ) {
    return dubicoltStore.updatePromotion(id, data);
  }

  validate(code: string, subtotal: number) {
    return dubicoltStore.validatePromotion(code, subtotal);
  }
}

export const promotionsService = new PromotionsService();
