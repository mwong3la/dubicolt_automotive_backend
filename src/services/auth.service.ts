import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';
import { dubicoltStore } from '../dubicolt/store';
import { signTokens } from '../middlewares/auth.middleware';
import { notifyWelcome } from '../notifications/email.notifications';
import type { DubicoltUser } from '../dubicolt/types';

export class AuthService {
  async login(email: string, password: string) {
    const row = await dubicoltStore.findUserRowByEmail(email);
    if (!row || !(await bcrypt.compare(password, row.password))) {
      throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
    }
    if (!row.is_active) {
      throw new AppError(403, 'account_disabled', 'This account has been deactivated');
    }
    const user = {
      id: row.id,
      email: row.email,
      passwordHash: row.password,
      name: row.name,
      role: row.role as DubicoltUser['role'],
    };
    return { ...signTokens(user), user: dubicoltStore.toPublicUser(user) };
  }

  async register(data: { name: string; email: string; password: string }) {
    if (await dubicoltStore.findUserRowByEmail(data.email)) {
      throw new AppError(400, 'email_exists', 'Account already exists with this email');
    }
    const user = await dubicoltStore.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    void notifyWelcome(user.id);
    return { ...signTokens(user), user: dubicoltStore.toPublicUser(user) };
  }

  me(user: DubicoltUser) {
    return dubicoltStore.toPublicUser(user);
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const profile = await dubicoltStore.updateUserProfile(userId, data);
    if (!profile) throw new AppError(404, 'not_found', 'User not found');
    return profile;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await dubicoltStore.changeUserPassword(userId, currentPassword, newPassword);
    return { ok: true };
  }
}

export const authService = new AuthService();
