import { Module } from '@nestjs/common';
import { RedisModule as Redis } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    Redis.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          // host: configService.get('REDIS_HOST'),
          // port: configService.get('REDIS_PORT'),
          // username: configService.get('REDIS_USER'),
          // password: configService.get('REDIS_PASSWORD'),
          // uri: configService.get('REDIS_URI'),
          url: 'redis://localhost:6379',
        },
      }),
    }),
  ],
})
export class RedisModule {}
