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
        if (!body.name || !body.sku || body.price_usd <= 0 || body.stock < 1) {
            throw new AppError_1.AppError(400, 'validation_error', 'Invalid product data', {
                form: ['name, sku, price_usd > 0, and stock >= 1 are required'],
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
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
