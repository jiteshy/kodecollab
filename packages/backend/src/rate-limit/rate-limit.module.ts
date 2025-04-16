import { Module } from '@nestjs/common';
import { RateLimiter } from './rate-limiter';
import { RedisRateLimiter } from './redis-rate-limiter';
import { RedisService } from '../services/redis.service';

@Module({
  providers: [RateLimiter, RedisRateLimiter, RedisService],
  exports: [RateLimiter, RedisRateLimiter],
})
export class RateLimitModule {}
