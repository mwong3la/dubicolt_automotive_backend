import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';
import { dubicoltStore } from '../dubicolt/store';
import { signTokens } from '../middlewares/auth.middleware';
import type { DubicoltUser } from '../dubicolt/types';

export class AuthService {
  async login(email: string, password: string) {
    const user = await dubicoltStore.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
    }
    return { ...signTokens(user), user: dubicoltStore.toPublicUser(user) };
  }

  async register(data: { name: string; email: string; password: string }) {
    if (await dubicoltStore.findUserByEmail(data.email)) {
      throw new AppError(400, 'email_exists', 'Account already exists with this email');
    }
    const user = await dubicoltStore.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    return { ...signTokens(user), user: dubicoltStore.toPublicUser(user) };
  }

  me(user: DubicoltUser) {
    return dubicoltStore.toPublicUser(user);
  }
}

export const authService = new AuthService();
