import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';
import { RedisService } from '../services/redis.service';
import { ConfigService } from '@nestjs/config';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

/**
 * Redis-based rate limiter for WebSocket events.
 * 
 * This implementation stores rate limit counters in Redis, making it suitable
 * for distributed environments. It provides better resilience in clustered deployments.
 */
@Injectable()
export class RedisRateLimiter implements OnModuleInit {
  private readonly RATE_LIMIT_PREFIX = 'rate_limit:';
  private readonly logger = new Logger(RedisRateLimiter.name);
  private rateLimits: Map<MessageType, RateLimitConfig> = new Map();

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    // Configure rate limits for different event types
    this.configureRateLimits();
    this.logger.log('Redis rate limiter initialized with configured limits');
  }

  private configureRateLimits() {
    // JOIN: Allow 5 attempts per minute
    this.rateLimits.set(MessageType.JOIN, {
      windowMs: 60000,
      maxRequests: 5,
      message: 'Too many join attempts. Please try again later.',
    });

    // CONTENT_CHANGE: Allow 10 events per second
    this.rateLimits.set(MessageType.CONTENT_CHANGE, {
      windowMs: 1000,
      maxRequests: 10,
      message: 'Too many content changes. Please wait a moment.',
    });

    // CURSOR_MOVE: Allow 30 events per 100ms
    this.rateLimits.set(MessageType.CURSOR_MOVE, {
      windowMs: 100,
      maxRequests: 30,
      message: 'Too many cursor movements. Please wait a moment.',
    });

    // TYPING_STATUS: Allow 5 events per second
    this.rateLimits.set(MessageType.TYPING_STATUS, {
      windowMs: 1000,
      maxRequests: 5,
      message: 'Too many typing status updates. Please wait a moment.',
    });
  }

  /**
   * Creates a Redis key for the rate limit counter.
   * @param eventType - The type of event being rate limited
   * @param sessionId - The session ID associated with the request
   * @returns A Redis key string
   */
  private getRateLimitKey(eventType: MessageType, sessionId: string, userId: string): string {
    return `${this.RATE_LIMIT_PREFIX}${eventType}:${sessionId}:${userId || 'anonymous'}`;
  }

  /**
   * Checks if a request should be rate limited.
   * @param socket - The socket.io Socket instance
   * @param eventType - The type of event to check
   * @returns An object indicating if the request is limited and an optional message
   */
  async isRateLimited(
    socket: Socket,
    eventType: MessageType,
  ): Promise<{ limited: boolean; message?: string }> {
    try {
      const sessionId = socket.handshake?.query.sessionId as string;
      const userId = socket.data?.userId || socket.id;

      // If we don't have a config for this event type, don't rate limit
      const config = this.rateLimits.get(eventType);
      if (!config) {
        return { limited: false };
      }

      const key = this.getRateLimitKey(eventType, sessionId, userId);

      // Get current count from Redis
      const data = await this.redisService.get(key);
      
      if (!data) {
        // First request, set to 1 with expiration based on window
        await this.redisService.set(key, '1', Math.ceil(config.windowMs / 1000));
        return { limited: false };
      }

      const currentCount = parseInt(data, 10);
      if (currentCount >= config.maxRequests) {
        this.logger.warn(`Rate limit exceeded for ${eventType} in session ${sessionId} by user ${userId}`);
        return { limited: true, message: config.message };
      }

      // Increment the counter
      await this.redisService.set(
        key, 
        (currentCount + 1).toString(), 
        Math.ceil(config.windowMs / 1000)
      );
      return { limited: false };
    } catch (error) {
      this.logger.error(`Error checking rate limit: ${error.message}`);
      // On error, don't rate limit to avoid blocking legitimate traffic
      return { limited: false, message: 'Error checking rate limit' };
    }
  }

  /**
   * Clears rate limit data for a socket.
   * @param socket - The socket.io Socket instance
   */
  async clear(socket: Socket): Promise<void> {
    try {
      const sessionId = socket.handshake?.query.sessionId as string;
      const userId = socket.data?.userId || socket.id;

      // Clear limits for all event types for this user
      for (const eventType of this.rateLimits.keys()) {
        const key = this.getRateLimitKey(eventType, sessionId, userId);
        await this.redisService.del(key);
      }
    } catch (error) {
      this.logger.error(`Error clearing rate limit: ${error.message}`);
    }
  }
}
