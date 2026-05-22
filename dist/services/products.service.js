"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsService = exports.ProductsService = void 0;
const AppError_1 = require("../errors/AppError");
const store_1 = require("../dubiken/store");
class ProductsService {
    async getById(id) {
        const product = await store_1.dubikenStore.getProduct(id);
        if (!product)
            throw new AppError_1.AppError(404, 'not_found', 'Product not found');
        return product;
    }
    async getRelated(id, limit) {
        return { data: await store_1.dubikenStore.getRelatedProducts(id, limit) };
    }
    async listMarketplace(query) {
        return store_1.dubikenStore.listMarketplace(query);
    }
    async listCategories(page = 1, page_size = 12) {
        return store_1.dubikenStore.listExploreCategoriesPaginated(page, page_size);
    }
    async getHomeFeed() {
        return store_1.dubikenStore.getHomeFeed();
    }
}
exports.ProductsService = ProductsService;
exports.productsService = new ProductsService();
