"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = exports.update = exports.get = exports.list = exports.create = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const mvp_products_service_1 = require("../services/mvp-products.service");
const AppError_1 = require("../errors/AppError");
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const body = req.body ?? {};
    if (!body.title || !body.sku || !body.sellingPrice) {
        throw new AppError_1.AppError(400, 'validation_error', 'title, sku, and sellingPrice are required');
    }
    res.status(201).json(await mvp_products_service_1.mvpProductsService.create(body));
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await mvp_products_service_1.mvpProductsService.list());
});
exports.get = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const product = await mvp_products_service_1.mvpProductsService.get(req.params.id);
    if (!product)
        throw new AppError_1.AppError(404, 'not_found', 'Product not found');
    res.json(product);
});
exports.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const product = await mvp_products_service_1.mvpProductsService.update(req.params.id, req.body ?? {});
    if (!product)
        throw new AppError_1.AppError(404, 'not_found', 'Product not found');
    res.json(product);
});
exports.search = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { keyword, make, model, year, category, brand } = req.query;
    res.json(await mvp_products_service_1.mvpProductsService.search({
        keyword: keyword,
        make: make,
        model: model,
        year: year ? Number(year) : undefined,
        category: category,
        brand: brand,
    }));
});
