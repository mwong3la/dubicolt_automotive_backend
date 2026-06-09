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
class AuthService {
    async login(email, password) {
        const user = await store_1.dubicoltStore.findUserByEmail(email);
        if (!user || !(await bcrypt_1.default.compare(password, user.passwordHash))) {
            throw new AppError_1.AppError(401, 'invalid_credentials', 'Invalid email or password');
        }
        return { ...(0, auth_middleware_1.signTokens)(user), user: store_1.dubicoltStore.toPublicUser(user) };
    }
    async register(data) {
        if (await store_1.dubicoltStore.findUserByEmail(data.email)) {
            throw new AppError_1.AppError(400, 'email_exists', 'Account already exists with this email');
        }
        const user = await store_1.dubicoltStore.createUser({
            email: data.email,
            password: data.password,
            name: data.name,
        });
        return { ...(0, auth_middleware_1.signTokens)(user), user: store_1.dubicoltStore.toPublicUser(user) };
    }
    me(user) {
        return store_1.dubicoltStore.toPublicUser(user);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
