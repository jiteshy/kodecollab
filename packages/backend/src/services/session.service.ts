import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { Session, User } from '@kodecollab/shared';
import {
  DEFAULT_CONTENT,
  DEFAULT_LANGUAGE,
  getRandomColor,
} from '@kodecollab/shared';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService {
  private readonly MAX_USERS_PER_SESSION: number;
  private readonly SESSION_TTL: number;
  private readonly EMPTY_SESSION_TTL: number;
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.MAX_USERS_PER_SESSION = this.configService.get<number>('MAX_USERS_PER_SESSION', 5);
    this.SESSION_TTL = this.configService.get<number>('SESSION_TTL', 14400); // 4 hours in seconds
    this.EMPTY_SESSION_TTL = this.configService.get<number>('EMPTY_SESSION_TTL', 3600); // 1 hour in seconds
  }

  async getOrCreateSession(sessionId: string): Promise<Session> {
    let session = await this.redisService.getSession(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        content: DEFAULT_CONTENT,
        language: DEFAULT_LANGUAGE,
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };
      await this.redisService.setSession(sessionId, session);
      // Set initial TTL for new session
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
    return session;
  }

  async addUserToSession(sessionId: string, username: string): Promise<User> {
    const session = await this.getOrCreateSession(sessionId);

    // Check for duplicate username
    if (
      Array.from(session.users.values()).some(
        (user) => user.username === username,
      )
    ) {
      throw new Error('Username already taken');
    }

    // Check if session is full
    if (session.users.size >= this.MAX_USERS_PER_SESSION) {
      throw new Error('Session is full');
    }

    // Create new user
    const userId = uuidv4();
    const user: User = {
      id: userId,
      username,
      color: getRandomColor(),
      lastActive: Date.now(),
      sessionId,
    };

    // Add user to session
    session.users.set(userId, user);
    session.lastActive = Date.now();
    await this.redisService.setSession(sessionId, session);

    return user;
  }

  async removeUserFromSession(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      const user = session.users.get(userId);
      if (user) {
        session.users.delete(userId);
        session.lastActive = Date.now();

        await this.redisService.setSession(sessionId, session);

        if (session.users.size === 0) {
          await this.redisService.setSessionTTL(
            sessionId,
            this.EMPTY_SESSION_TTL,
          );
        }
      }
    }
  }

  async updateSessionContent(
    sessionId: string,
    content: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      session.content = content;
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
  }

  async updateSessionLanguage(
    sessionId: string,
    language: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      session.language = language;
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
  }

  /**
   * Updates a user's data in a session
   * @param sessionId - ID of the session containing the user
   * @param userId - ID of the user to update
   * @param userData - Updated user data
   */
  async updateUser(
    sessionId: string,
    userId: string,
    userData: User,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session && session.users.has(userId)) {
      session.users.set(userId, userData);
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
  }

}
