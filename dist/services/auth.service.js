"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const AppError_1 = require("../errors/AppError");
const store_1 = require("../dubicolt/store");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const email_notifications_1 = require("../notifications/email.notifications");
class AuthService {
    async login(email, password) {
        const row = await store_1.dubicoltStore.findUserRowByEmail(email);
        if (!row || !(await bcrypt_1.default.compare(password, row.password))) {
            throw new AppError_1.AppError(401, 'invalid_credentials', 'Invalid email or password');
        }
        if (!row.is_active) {
            throw new AppError_1.AppError(403, 'account_disabled', 'This account has been deactivated');
        }
        const user = {
            id: row.id,
            email: row.email,
            passwordHash: row.password,
            name: row.name,
            role: row.role,
        };
        return { ...(0, auth_middleware_1.signTokens)(user), user: store_1.dubicoltStore.toPublicUser(user) };
    }
    async register(data) {
        if (await store_1.dubicoltStore.findUserRowByEmail(data.email)) {
            throw new AppError_1.AppError(400, 'email_exists', 'Account already exists with this email');
        }
        const user = await store_1.dubicoltStore.createUser({
            email: data.email,
            password: data.password,
            name: data.name,
        });
        void (0, email_notifications_1.notifyWelcome)(user.id);
        return { ...(0, auth_middleware_1.signTokens)(user), user: store_1.dubicoltStore.toPublicUser(user) };
    }
    me(user) {
        return store_1.dubicoltStore.toPublicUser(user);
    }
    async updateProfile(userId, data) {
        const profile = await store_1.dubicoltStore.updateUserProfile(userId, data);
        if (!profile)
            throw new AppError_1.AppError(404, 'not_found', 'User not found');
        return profile;
    }
    async changePassword(userId, currentPassword, newPassword) {
        await store_1.dubicoltStore.changeUserPassword(userId, currentPassword, newPassword);
        return { ok: true };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
