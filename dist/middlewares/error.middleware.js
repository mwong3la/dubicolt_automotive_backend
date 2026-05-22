"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const AppError_1 = require("../errors/AppError");
const response_1 = require("../utils/response");
function notFoundHandler(_req, res) {
    (0, response_1.sendError)(res, 404, 'not_found', 'Route not found');
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError_1.AppError) {
        (0, response_1.sendError)(res, err.statusCode, err.code, err.message, err.details);
        return;
    }
    console.error(err);
    (0, response_1.sendError)(res, 500, 'internal_error', 'An unexpected error occurred');
}
