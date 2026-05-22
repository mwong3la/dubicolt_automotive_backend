"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.register = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_validator_1 = require("../validators/auth.validator");
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = (0, auth_validator_1.validateLogin)(req.body ?? {});
    const result = await auth_service_1.authService.login(email, password);
    res.json(result);
});
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = (0, auth_validator_1.validateRegister)(req.body ?? {});
    const result = await auth_service_1.authService.register(data);
    res.status(201).json(result);
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.status(204).send();
});
exports.me = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(await auth_service_1.authService.me(req.user));
});
