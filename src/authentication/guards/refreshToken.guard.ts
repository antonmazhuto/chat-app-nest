import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCacheService } from '../cache/authCache.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private authCacheService: AuthCacheService,
    private userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userId = await this.authCacheService.getUserIdByRefreshToken(
      request.cookies?.Refresh,
    );

    console.log('REFRESH_GUARD_USERID', userId);

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findById(parseInt(userId));

    if (!user) throw new UnauthorizedException();

    request.user = user;

    return true;
  }
}
