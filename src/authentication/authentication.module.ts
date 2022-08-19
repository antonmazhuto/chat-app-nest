import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthCacheService } from './cache/authCache.service';
import { GoogleAuthenticationService } from '@app/authentication/googleAuthentication.service';

@Module({
  imports: [UserModule, ConfigModule],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    AuthCacheService,
    GoogleAuthenticationService,
  ],
  exports: [AuthenticationService, AuthCacheService],
})
export class AuthenticationModule {}
