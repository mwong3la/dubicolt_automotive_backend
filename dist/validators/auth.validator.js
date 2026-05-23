"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = validateLogin;
exports.validateRegister = validateRegister;
const AppError_1 = require("../errors/AppError");
function validateLogin(body) {
    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    const details = {};
    if (!email)
        details.email = ['Email is required'];
    if (!password)
        details.password = ['Password is required'];
    if (Object.keys(details).length) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', details);
    }
    return { email, password };
}
function validateRegister(body) {
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    const details = {};
    if (!name || name.length < 2) {
        details.name = ['Full name must be at least 2 characters'];
    }
    if (!email)
        details.email = ['Email is required'];
    if (!password || password.length < 8) {
        details.password = ['Password must be at least 8 characters'];
    }
    if (Object.keys(details).length) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', details);
    }
    return { name, email, password };
}
