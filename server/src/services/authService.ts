import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository.js';
import { SessionRepository } from '../repositories/sessionRepository.js';
import { hashToken, generateToken } from '../utils/auth.js';
import { Role, UserStatus } from '@prisma/client';

export class AuthService {
  private userRepository = new UserRepository();
  private sessionRepository = new SessionRepository();

  async register(data: { name: string; email: string; password: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw { status: 409, message: 'An account with this email already exists.' };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    
    const user = await this.userRepository.create({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
    });

    const { session, token } = await this.createSession(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  async login(data: { email: string; password: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw { status: 403, message: 'Your account has been suspended. Please contact support.' };
    }

    if (user.status === UserStatus.INACTIVE) {
      throw { status: 403, message: 'Your account is inactive.' };
    }

    const { session, token } = await this.createSession(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  async createSession(userId: string) {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.sessionRepository.create({
      user: { connect: { id: userId } },
      tokenHash,
      expiresAt,
    });

    return { session, token };
  }

  async validateSession(token: string) {
    const tokenHash = hashToken(token);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await this.sessionRepository.delete(session.id);
      return null;
    }

    return session.user;
  }

  async logout(token: string) {
    const tokenHash = hashToken(token);
    try {
      await this.sessionRepository.deleteByTokenHash(tokenHash);
    } catch (e) {
      // Ignore if session already gone
    }
  }

  async cleanupSessions() {
    await this.sessionRepository.deleteExpired();
  }
}
