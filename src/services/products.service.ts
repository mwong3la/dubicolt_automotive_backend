import { AppError } from '../errors/AppError';
import { dubikenStore } from '../dubiken/store';

export class ProductsService {
  async getById(id: string) {
    const product = await dubikenStore.getProduct(id);
    if (!product) throw new AppError(404, 'not_found', 'Product not found');
    return product;
  }

  async getRelated(id: string, limit: number) {
    return { data: await dubikenStore.getRelatedProducts(id, limit) };
  }

  async listMarketplace(query: {
    hub?: string;
    category?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    return dubikenStore.listMarketplace(query);
  }

  async listCategories(page = 1, page_size = 12) {
    return dubikenStore.listExploreCategoriesPaginated(page, page_size);
  }

  async getHomeFeed() {
    return dubikenStore.getHomeFeed();
  }
}

export const productsService = new ProductsService();
