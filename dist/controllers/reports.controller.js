"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboard = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const reports_service_1 = require("../services/reports.service");
exports.dashboard = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json(await reports_service_1.reportsService.dashboard());
});
