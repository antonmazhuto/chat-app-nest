import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { ConfigModule } from '@nestjs/config';
import { AuthCacheService } from '../authentication/cache/authCache.service';
import { FilesModule } from '../files/files.module';
import { LocationModule } from '@app/location/location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    ConfigModule,
    FilesModule,
    LocationModule,
  ],
  controllers: [UserController],
  providers: [UserService, AuthCacheService],
  exports: [UserService],
})
export class UserModule {}
