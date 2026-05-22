import { AppError } from '../errors/AppError';
import { dubikenStore } from '../dubiken/store';
import type { HubCode } from '../dubiken/types';

export class AdminService {
  getDashboard() {
    return dubikenStore.getAdminDashboard();
  }

  getAnalytics() {
    return dubikenStore.getAdminAnalytics();
  }

  listCategories() {
    return dubikenStore.listCategories();
  }

  async getCategory(id: string) {
    const cat = await dubikenStore.getCategory(id);
    if (!cat) throw new AppError(404, 'not_found', 'Category not found');
    return cat;
  }

  async upsertCategory(body: {
    id?: string;
    name: string;
    description: string;
    origins: HubCode[];
    image_url: string;
    status: 'draft' | 'published';
  }) {
    try {
      return await dubikenStore.upsertCategory(body);
    } catch (e) {
      throw new AppError(404, 'not_found', (e as Error).message);
    }
  }

  async getInventoryKpis() {
    await dubikenStore.refreshInventoryKpis();
    return dubikenStore.inventoryKpis;
  }

  syncStorefront() {
    return dubikenStore.syncStorefrontFromInventory({ force: true });
  }

  listInventory(query: { search?: string; page?: number; page_size?: number }) {
    return dubikenStore.listInventory(query);
  }

  async getInventoryProduct(id: string) {
    const product = await dubikenStore.getInventoryProduct(id);
    if (!product) throw new AppError(404, 'not_found', 'Inventory product not found');
    return product;
  }

  createProduct(body: Parameters<typeof dubikenStore.createInventoryProduct>[0]) {
    if (!body.name || !body.sku || body.price_usd <= 0 || body.stock < 1) {
      throw new AppError(400, 'validation_error', 'Invalid product data', {
        form: ['name, sku, price_usd > 0, and stock >= 1 are required'],
      });
    }
    return dubikenStore.createInventoryProduct(body);
  }

  async updateProduct(
    id: string,
    body: Partial<Parameters<typeof dubikenStore.createInventoryProduct>[0]>,
  ) {
    const result = await dubikenStore.updateInventoryProduct(id, body);
    if (!result) throw new AppError(404, 'not_found', 'Inventory product not found');
    return result;
  }

  listSourcingRequests(query: {
    market?: string;
    status?: string[];
    page?: number;
    page_size?: number;
  }) {
    return dubikenStore.listAdminSourcing(query);
  }

  async getSourcingDetail(id: string) {
    const detail = await dubikenStore.getAdminSourcingDetail(id);
    if (!detail) throw new AppError(404, 'not_found', 'Sourcing request not found');
    return detail;
  }

  async saveOfficialQuote(requestId: string, body: Record<string, unknown>) {
    const result = await dubikenStore.saveOfficialQuote(
      requestId,
      body as Parameters<typeof dubikenStore.saveOfficialQuote>[1],
    );
    if (!result) throw new AppError(404, 'not_found', 'Sourcing request not found');
    return { quote: result.quote, request_status: result.request_status };
  }

  async listOrders() {
    return { data: await dubikenStore.listAdminMarketplaceOrders() };
  }
}

export const adminService = new AdminService();
