import { dubicoltStore } from '../dubicolt/store';

export class InventoryService {
  stockIn(productId: string, quantity: number) {
    return dubicoltStore.stockIn(productId, quantity);
  }

  stockOut(productId: string, quantity: number) {
    return dubicoltStore.stockOut(productId, quantity);
  }

  list() {
    return dubicoltStore.listInventory();
  }
}

export const inventoryService = new InventoryService();
