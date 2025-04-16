import { Test, TestingModule } from '@nestjs/testing';
import { RedisRateLimiter } from './redis-rate-limiter';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';
import { RedisService } from '../services/redis.service';

describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;
  let mockRedisService: Partial<RedisService>;
  let mockSocket: Partial<Socket>;
  let module: TestingModule;

  beforeEach(async () => {
    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      ttl: jest.fn(),
      del: jest.fn(),
    };

    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        query: {
          sessionId: 'test-session',
        },
        headers: {},
        time: new Date().toISOString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: Date.now(),
        url: '/',
        auth: {},
      },
    };

    module = await Test.createTestingModule({
      providers: [
        RedisRateLimiter,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    rateLimiter = module.get<RedisRateLimiter>(RedisRateLimiter);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('isRateLimited', () => {
    it('should return false when under rate limit', async () => {
      const key = `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`;
      (mockRedisService.get as jest.Mock).mockResolvedValue('1');
      (mockRedisService.set as jest.Mock).mockResolvedValue(undefined);

      const result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );

      expect(result.limited).toBe(false);
      expect(mockRedisService.get).toHaveBeenCalledWith(key);
      expect(mockRedisService.set).toHaveBeenCalledWith(key, '2', 300);
    });

    it('should return true when exceeding rate limit', async () => {
      const key = `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`;
      (mockRedisService.get as jest.Mock).mockResolvedValue('11');

      const result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );

      expect(result.limited).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(key);
    });

    it('should handle new keys', async () => {
      const key = `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`;
      (mockRedisService.get as jest.Mock).mockResolvedValue(null);
      (mockRedisService.set as jest.Mock).mockResolvedValue(undefined);

      const result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );

      expect(result.limited).toBe(false);
      expect(mockRedisService.set).toHaveBeenCalledWith(key, '1', 300);
    });

    it('should handle Redis errors gracefully', async () => {
      (mockRedisService.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(
        rateLimiter.isRateLimited(mockSocket as Socket, MessageType.JOIN),
      ).resolves.toEqual({
        limited: false,
        message: 'Error checking rate limit',
      });
    });
  });

  describe('clear', () => {
    it('should clear rate limit for socket', async () => {
      (mockRedisService.del as jest.Mock).mockResolvedValue(undefined);

      await rateLimiter.clear(mockSocket as Socket);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`,
      );
    });

    it('should handle Redis errors gracefully', async () => {
      (mockRedisService.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(
        rateLimiter.clear(mockSocket as Socket),
      ).resolves.not.toThrow();
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`,
      );
    });
  });
});
