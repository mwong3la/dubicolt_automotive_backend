import { dubicoltStore } from '../dubicolt/store';
import type { UserRole } from '../dubicolt/types';

export class UsersService {
  list(query?: { search?: string; role?: UserRole; page?: number; pageSize?: number }) {
    return dubicoltStore.listUsers(query);
  }

  create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }) {
    return dubicoltStore.createUserAdmin(data);
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      role: UserRole;
      is_active: boolean;
      password: string;
    }>,
  ) {
    return dubicoltStore.updateUser(id, data);
  }
}

export const usersService = new UsersService();
