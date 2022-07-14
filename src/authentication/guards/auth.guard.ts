import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthCacheService } from '../cache/authCache.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authCacheService: AuthCacheService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.get<boolean>('isPublic', context.getHandler())) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const userId = await this.authCacheService.getUserIdByAccessToken(
      request?.cookies.Authentication,
    );

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findById(parseInt(userId));

    if (!user) {
      throw new UnauthorizedException();
    }
    request.user = user;

    return true;
  }
}
