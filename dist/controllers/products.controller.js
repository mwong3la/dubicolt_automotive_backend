"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeFeed = exports.listCategories = exports.listMarketplace = exports.getRelated = exports.getProduct = void 0;
const products_service_1 = require("../services/products.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const query_1 = require("../utils/query");
exports.getProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await products_service_1.productsService.getById(req.params.id));
});
exports.getRelated = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const limit = Math.min(20, (0, query_1.parseIntQuery)(req.query.limit, 4));
    res.json(await products_service_1.productsService.getRelated(req.params.id, limit));
});
exports.listMarketplace = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await products_service_1.productsService.listMarketplace({
        hub: req.query.hub,
        category: req.query.category,
        search: req.query.search,
        page: (0, query_1.parseIntQuery)(req.query.page, 1),
        page_size: (0, query_1.parseIntQuery)(req.query.page_size, 24),
    }));
});
exports.listCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await products_service_1.productsService.listCategories((0, query_1.parseIntQuery)(req.query.page, 1), (0, query_1.parseIntQuery)(req.query.page_size, 12)));
});
exports.getHomeFeed = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await products_service_1.productsService.getHomeFeed());
});
