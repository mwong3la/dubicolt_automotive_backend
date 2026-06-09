import { dubicoltStore } from '../dubicolt/store';

export class SuppliersService {
  create(data: { name: string; phone?: string; email?: string }) {
    return dubicoltStore.createSupplier(data);
  }

  list() {
    return dubicoltStore.listSuppliers();
  }

  update(id: string, data: Partial<{ name: string; phone?: string; email?: string }>) {
    return dubicoltStore.updateSupplier(id, data);
  }
}

export const suppliersService = new SuppliersService();
