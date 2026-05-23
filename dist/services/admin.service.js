"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const AppError_1 = require("../errors/AppError");
const store_1 = require("../dubiken/store");
class AdminService {
    getDashboard() {
        return store_1.dubikenStore.getAdminDashboard();
    }
    getAnalytics() {
        return store_1.dubikenStore.getAdminAnalytics();
    }
    listCategories() {
        return store_1.dubikenStore.listCategories();
    }
    async getCategory(id) {
        const cat = await store_1.dubikenStore.getCategory(id);
        if (!cat)
            throw new AppError_1.AppError(404, 'not_found', 'Category not found');
        return cat;
    }
    async upsertCategory(body) {
        try {
            return await store_1.dubikenStore.upsertCategory(body);
        }
        catch (e) {
            throw new AppError_1.AppError(404, 'not_found', e.message);
        }
    }
    async getInventoryKpis() {
        await store_1.dubikenStore.refreshInventoryKpis();
        return store_1.dubikenStore.inventoryKpis;
    }
    syncStorefront() {
        return store_1.dubikenStore.syncStorefrontFromInventory({ force: true });
    }
    listInventory(query) {
        return store_1.dubikenStore.listInventory(query);
    }
    async getInventoryProduct(id) {
        const product = await store_1.dubikenStore.getInventoryProduct(id);
        if (!product)
            throw new AppError_1.AppError(404, 'not_found', 'Inventory product not found');
        return product;
    }
    createProduct(body) {
        if (!body.name?.trim() || !body.sku?.trim()) {
            throw new AppError_1.AppError(400, 'validation_error', 'Invalid product data', {
                form: ['name and sku are required'],
            });
        }
        const publishing = body.status === 'published';
        if (publishing && (body.price_kes <= 0 || body.stock < 1)) {
            throw new AppError_1.AppError(400, 'validation_error', 'Invalid product data', {
                form: ['price_kes > 0 and stock >= 1 are required to publish'],
            });
        }
        return store_1.dubikenStore.createInventoryProduct(body);
    }
    async updateProduct(id, body) {
        const result = await store_1.dubikenStore.updateInventoryProduct(id, body);
        if (!result)
            throw new AppError_1.AppError(404, 'not_found', 'Inventory product not found');
        return result;
    }
    listSourcingRequests(query) {
        return store_1.dubikenStore.listAdminSourcing(query);
    }
    async getSourcingDetail(id) {
        const detail = await store_1.dubikenStore.getAdminSourcingDetail(id);
        if (!detail)
            throw new AppError_1.AppError(404, 'not_found', 'Sourcing request not found');
        return detail;
    }
    async saveOfficialQuote(requestId, body) {
        const result = await store_1.dubikenStore.saveOfficialQuote(requestId, body);
        if (!result)
            throw new AppError_1.AppError(404, 'not_found', 'Sourcing request not found');
        return { quote: result.quote, request_status: result.request_status };
    }
    async listOrders() {
        return { data: await store_1.dubikenStore.listAdminMarketplaceOrders() };
    }
    async updateMarketplaceOrderStatus(id, status) {
        const row = await store_1.dubikenStore.updateMarketplaceOrderStatus(id, status);
        if (!row) {
            const normalized = status.trim().toUpperCase();
            const allowed = ['PROCESSING', 'IN TRANSIT', 'DELIVERED', 'CANCELLED'];
            if (!allowed.includes(normalized)) {
                throw new AppError_1.AppError(400, 'validation_error', 'Invalid order status', {
                    status: [`Must be one of: ${allowed.join(', ')}`],
                });
            }
            throw new AppError_1.AppError(404, 'not_found', 'Order not found');
        }
        return row;
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
