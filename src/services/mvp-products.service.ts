import { dubicoltStore } from '../dubicolt/store';
import type { ProductPayload } from '../dubicolt/types';

export class MvpProductsService {
  create(data: ProductPayload) {
    return dubicoltStore.createProduct(data);
  }

  list() {
    return dubicoltStore.listProducts();
  }

  get(id: string) {
    return dubicoltStore.getProduct(id);
  }

  update(id: string, data: Partial<ProductPayload>) {
    return dubicoltStore.updateProduct(id, data);
  }

  search(filters: {
    keyword?: string;
    make?: string;
    model?: string;
    year?: number;
    category?: string;
    brand?: string;
  }) {
    return dubicoltStore.searchProducts(filters);
  }
}

export const mvpProductsService = new MvpProductsService();
