import { Injectable } from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { UserService } from '@app/user/user.service';

@Injectable()
export class AuthCacheService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly userService: UserService,
  ) {}

  async setTokens(
    userId: number,
    accessToken: string,
    refreshToken: string,
    accessTokenExpire: number,
    refreshTokenExpire: number,
  ) {
    await this.redis.set(`access-token:${accessToken}`, userId);
    await this.redis.set(`refresh-token:${refreshToken}`, userId);
    await this.redis.hset(`usr:${userId}`, { refreshToken, accessToken });

    await this.redis.expire(`access-token:${accessToken}`, accessTokenExpire);
    await this.redis.expire(
      `refresh-token:${refreshToken}`,
      refreshTokenExpire,
    );
    await this.redis.expire(`usr:${userId}`, refreshTokenExpire);
  }

  async getUserIdByAccessToken(accessToken: string) {
    return this.redis.get(`access-token:${accessToken}`);
  }

  async getUserIdByRefreshToken(refreshToken: string) {
    return this.redis.get(`refresh-token:${refreshToken}`);
  }

  async deleteCache(userId: number) {
    const { accessToken, refreshToken } = await this.redis.hgetall(
      `usr:${userId}`,
    );

    await this.redis.unlink(
      `access-token:${accessToken}`,
      `refresh-token:${refreshToken}`,
      `usr:${userId}`,
    );

    const check = await this.redis.get(`usr:${userId}`);
  }

  async getUserFromAuthenticationToken(token: string) {
    const userId = await this.getUserIdByAccessToken(token);
    return await this.userService.findById(parseInt(userId));
  }
}
