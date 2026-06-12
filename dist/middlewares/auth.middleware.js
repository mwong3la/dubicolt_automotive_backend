"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signTokens = signTokens;
exports.optionalAuth = optionalAuth;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const store_1 = require("../dubicolt/store");
const AppError_1 = require("../errors/AppError");
const JWT_SECRET = process.env.JWT_SECRET || 'dubicolt-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
function signTokens(user) {
    const accessOpts = { expiresIn: '1h' };
    const refreshOpts = { expiresIn: JWT_EXPIRES_IN };
    const access_token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, accessOpts);
    const refresh_token = jsonwebtoken_1.default.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, refreshOpts);
    return { access_token, refresh_token, expires_in: 3600 };
}
async function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        next();
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await store_1.dubicoltStore.getUser(decoded.userId);
        if (user)
            req.user = user;
    }
    catch {
        // Ignore invalid tokens for optional auth routes.
    }
    next();
}
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        next(new AppError_1.AppError(401, 'unauthorized', 'Authentication required'));
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await store_1.dubicoltStore.getUser(decoded.userId);
        if (!user) {
            next(new AppError_1.AppError(401, 'unauthorized', 'Invalid user'));
            return;
        }
        req.user = user;
        next();
    }
    catch {
        next(new AppError_1.AppError(401, 'unauthorized', 'Invalid or expired token'));
    }
}
function requireAdmin(req, res, next) {
    if (!req.user) {
        next(new AppError_1.AppError(401, 'unauthorized', 'Authentication required'));
        return;
    }
    if (req.user.role !== 'admin') {
        next(new AppError_1.AppError(403, 'forbidden', 'Admin access required'));
        return;
    }
    next();
}
