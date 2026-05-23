"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMarketplaceOrder = exports.listOrders = exports.saveOfficialQuote = exports.getSourcingDetail = exports.listSourcingRequests = exports.updateInventoryProduct = exports.createInventoryProduct = exports.getInventoryProduct = exports.listInventory = exports.syncStorefront = exports.getInventoryKpis = exports.updateCategory = exports.createCategory = exports.getCategory = exports.listCategories = exports.getAnalytics = exports.getDashboard = void 0;
const admin_service_1 = require("../services/admin.service");
const AppError_1 = require("../errors/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const query_1 = require("../utils/query");
const sourcing_validator_1 = require("../validators/sourcing.validator");
exports.getDashboard = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await admin_service_1.adminService.getDashboard());
});
exports.getAnalytics = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await admin_service_1.adminService.getAnalytics());
});
exports.listCategories = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await admin_service_1.adminService.listCategories());
});
exports.getCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await admin_service_1.adminService.getCategory(req.params.id));
});
exports.createCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const cat = await admin_service_1.adminService.upsertCategory(req.body);
    res.status(201).json(cat);
});
exports.updateCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await admin_service_1.adminService.upsertCategory({ ...req.body, id: req.params.id }));
});
exports.getInventoryKpis = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await admin_service_1.adminService.getInventoryKpis());
});
exports.syncStorefront = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await admin_service_1.adminService.syncStorefront());
});
exports.listInventory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await admin_service_1.adminService.listInventory({
        search: req.query.search,
        page: (0, query_1.parseIntQuery)(req.query.page, 1),
        page_size: (0, query_1.parseIntQuery)(req.query.page_size, 20),
    }));
});
exports.getInventoryProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await admin_service_1.adminService.getInventoryProduct(req.params.id));
});
exports.createInventoryProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.status(201).json(await admin_service_1.adminService.createProduct(req.body));
});
exports.updateInventoryProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await admin_service_1.adminService.updateProduct(req.params.id, req.body));
});
exports.listSourcingRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await admin_service_1.adminService.listSourcingRequests({
        market: req.query.market || undefined,
        status: (0, query_1.parseStatuses)(req.query.status),
        page: (0, query_1.parseIntQuery)(req.query.page, 1),
        page_size: (0, query_1.parseIntQuery)(req.query.page_size, 10),
    }));
});
exports.getSourcingDetail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await admin_service_1.adminService.getSourcingDetail(req.params.id));
});
exports.saveOfficialQuote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const body = (0, sourcing_validator_1.validateOfficialQuote)(req.body ?? {});
    res.json(await admin_service_1.adminService.saveOfficialQuote(req.params.id, body));
});
exports.listOrders = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await admin_service_1.adminService.listOrders());
});
exports.updateMarketplaceOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const status = String(req.body?.status ?? '').trim();
    if (!status) {
        throw new AppError_1.AppError(400, 'validation_error', 'status is required', {
            status: ['status is required'],
        });
    }
    res.json(await admin_service_1.adminService.updateMarketplaceOrderStatus(req.params.id, status));
});
