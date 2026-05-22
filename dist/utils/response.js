"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = sendError;
exports.sendValidationError = sendValidationError;
exports.handleControllerError = handleControllerError;
const AppError_1 = require("../errors/AppError");
function sendError(res, status, code, message, details) {
    res.status(status).json({
        error: { code, message, ...(details ? { details } : {}) },
    });
}
function sendValidationError(res, details, message = 'Validation failed') {
    sendError(res, 400, 'validation_error', message, details);
}
function handleControllerError(res, err) {
    if (err instanceof AppError_1.AppError) {
        sendError(res, err.statusCode, err.code, err.message, err.details);
        return;
    }
    console.error(err);
    sendError(res, 500, 'internal_error', 'An unexpected error occurred');
}
