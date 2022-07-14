import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthCacheService } from './cache/authCache.service';
import { randomUUID } from 'crypto';
import { SignUpUserDto } from './dto/signUp.dto';
import { UserService } from '../user/user.service';
import PostgresErrorCodeEnum from '../database/types/postgresErrorCode.enum';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly configService: ConfigService,
    private authCacheService: AuthCacheService,
    private userService: UserService,
  ) {}
  private static getExpireDate(seconds: number): Date {
    return new Date(new Date(Date.now() + seconds * 1000).toUTCString());
  }

  private static async getAccessTokenCookie(
    accessToken: string,
    accessTokenExpireDate: Date,
  ) {
    console.log('FIXXXX', accessToken);
    console.log('FIXXXX', accessTokenExpireDate);
  }

  async createAndSaveTokenPair(userId: number) {
    const accessToken = randomUUID();
    const accessTokenExpire = this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );
    const accessTokenExpireDate =
      AuthenticationService.getExpireDate(accessTokenExpire);
    const accessTokenCookie = `Authentication=${accessToken}; Path=/; Expires=${accessTokenExpireDate}; HttpOnly`;

    AuthenticationService.getAccessTokenCookie(
      accessToken,
      accessTokenExpireDate,
    );

    const refreshToken = randomUUID();
    const refreshTokenExpire = this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );
    const refreshTokenExpireDate =
      AuthenticationService.getExpireDate(refreshTokenExpire);
    const refreshTokenCookie = `Refresh=${refreshToken}; Path=/; Expires=${refreshTokenExpireDate}; HttpOnly`;

    await this.authCacheService.deleteCache(userId);
    await this.authCacheService.setTokens(
      userId,
      accessToken,
      refreshToken,
      accessTokenExpire,
      refreshTokenExpire,
    );

    return { accessTokenCookie, refreshTokenCookie, accessTokenExpireDate };
  }

  public async signUp(registrationData: SignUpUserDto) {
    try {
      const createdUser = await this.userService.createUser(registrationData);
      createdUser.password = undefined;
      return createdUser;
    } catch (error) {
      console.log('error', error);
      if (error?.code === PostgresErrorCodeEnum.UniqueViolation) {
        throw new HttpException(
          'User with that email already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logout(userId: number) {
    await this.authCacheService.deleteCache(userId);
    const accessTokenCookie = `Authentication=; Path=/; Expires=${AuthenticationService.getExpireDate(
      0,
    )}`;
    const refreshTokenCookie = `Refresh=; Path=/api/auth/refresh-token; Expires=${AuthenticationService.getExpireDate(
      0,
    )}`;
    return { accessTokenCookie, refreshTokenCookie };
  }
}
