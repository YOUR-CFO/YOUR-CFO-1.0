import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'redis';

@Injectable()
export class CacheService {
  private client: Redis.RedisClientType;

  constructor(private configService: ConfigService) {
    this.client = Redis.createClient({
      socket: {
        host: this.configService.get<string>('redis.host'),
        port: this.configService.get<number>('redis.port'),
      },
      password: this.configService.get<string>('redis.password') || undefined,
      database: this.configService.get<number>('redis.db') || 0,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.connect();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      console.error(`Error setting TTL for cache key ${key}:`, error);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Error getting TTL for cache key ${key}:`, error);
      return -1;
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Error flushing cache:', error);
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      console.error(`Error getting hash field ${field} from key ${key}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hSet(key, field, value);
    } catch (error) {
      console.error(`Error setting hash field ${field} for key ${key}:`, error);
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.client.hDel(key, field);
    } catch (error) {
      console.error(`Error deleting hash field ${field} from key ${key}:`, error);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      const result = await this.client.hGetAll(key);
      return result || {};
    } catch (error) {
      console.error(`Error getting all hash fields from key ${key}:`, error);
      return {};
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      console.error(`Error pushing to list key ${key}:`, error);
      return 0;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rPush(key, values);
    } catch (error) {
      console.error(`Error pushing to list key ${key}:`, error);
      return 0;
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.client.lPop(key);
    } catch (error) {
      console.error(`Error popping from list key ${key}:`, error);
      return null;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      console.error(`Error popping from list key ${key}:`, error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      console.error(`Error getting list length for key ${key}:`, error);
      return 0;
    }
  }

  // Rate limiting helper
  async isRateLimited(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, window);
      }
      return current > limit;
    } catch (error) {
      console.error(`Error checking rate limit for key ${key}:`, error);
      return false;
    }
  }
}