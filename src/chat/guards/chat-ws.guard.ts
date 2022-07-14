import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthCacheService } from '@app/authentication/cache/authCache.service';
import { UserService } from '@app/user/user.service';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatWsGuard implements CanActivate {
  constructor(private cacheService: AuthCacheService) {}
  async canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const { Authentication: authenticationToken } = client?.cookies || {};
    const user = await this.cacheService.getUserFromAuthenticationToken(
      authenticationToken,
    );
    if (!user) {
      throw new WsException('Invalid credentials');
    }
    // const cookie = client.handshake?.headers?.cookie;
    // console.log('???', client.handshake);
    return true;
  }
}
