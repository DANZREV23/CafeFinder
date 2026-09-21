import { UserRepository } from '../repositories/userRepository.js';
import { Prisma } from '@prisma/client';

export class UserService {
  private userRepository = new UserRepository();

  async updateProfile(userId: string, data: { name?: string; email?: string; avatarUrl?: string }) {
    // Check if email is being changed and if it's already taken
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw { status: 409, message: 'Email already in use.' };
      }
    }

    const user = await this.userRepository.update(userId, data);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateStatus(userId: string, status: any) {
    return this.userRepository.update(userId, { status });
  }
}
