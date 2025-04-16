import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';
import { RedisService } from '../services/redis.service';

@Injectable()
export class RedisRateLimiter {
  private readonly windowMs = 300000; // 5 minutes
  private readonly maxRequests = 10;
  private readonly RATE_LIMIT_PREFIX = 'rate_limit:';

  constructor(private readonly redisService: RedisService) {}

  private getRateLimitKey(eventType: MessageType, sessionId: string): string {
    return `${this.RATE_LIMIT_PREFIX}${eventType}:${sessionId}`;
  }

  async isRateLimited(
    socket: Socket,
    eventType: MessageType,
  ): Promise<{ limited: boolean; message?: string }> {
    try {
      const sessionId = socket.handshake?.query.sessionId as string;
      const key = this.getRateLimitKey(eventType, sessionId);

      // We can't use multi command easily, so we'll use separate commands
      const data = await this.redisService.get(key);
      
      if (!data) {
        await this.redisService.set(key, '1', this.windowMs / 1000);
        return { limited: false };
      }

      const currentCount = parseInt(data, 10);
      if (currentCount >= this.maxRequests) {
        return { limited: true, message: 'Rate limit exceeded' };
      }

      await this.redisService.set(
        key, 
        (currentCount + 1).toString(), 
        this.windowMs / 1000
      );
      return { limited: false };
    } catch (error) {
      return { limited: false, message: 'Error checking rate limit' };
    }
  }

  async clear(socket: Socket): Promise<void> {
    try {
      const sessionId = socket.handshake?.query.sessionId as string;
      const key = this.getRateLimitKey(MessageType.JOIN, sessionId);
      await this.redisService.del(key);
    } catch (error) {
      // Silently handle Redis errors
    }
  }
}
