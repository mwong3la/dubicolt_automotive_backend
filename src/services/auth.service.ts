import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';
import { dubikenStore } from '../dubiken/store';
import { signTokens } from '../middlewares/auth.middleware';
import type { DubikenUser } from '../dubiken/types';

export class AuthService {
  async login(email: string, password: string) {
    const user = await dubikenStore.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
    }
    return { ...signTokens(user), user: dubikenStore.toPublicUser(user) };
  }

  async register(data: { name: string; email: string; password: string }) {
    if (await dubikenStore.findUserByEmail(data.email)) {
      throw new AppError(400, 'email_exists', 'Account already exists with this email');
    }
    const user = await dubikenStore.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    return { ...signTokens(user), user: dubikenStore.toPublicUser(user) };
  }

  me(user: DubikenUser) {
    return dubikenStore.toPublicUser(user);
  }
}

export const authService = new AuthService();
