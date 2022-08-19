import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Auth, google } from 'googleapis';
import { UserService } from '@app/user/user.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '@app/user/user.entity';
import { AuthenticationService } from '@app/authentication/authentication.service';

@Injectable()
export class GoogleAuthenticationService {
  oauthClient: Auth.OAuth2Client;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly authenticationService: AuthenticationService,
  ) {
    const clientID = this.configService.get('GOOGLE_AUTH_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_AUTH_CLIENT_SECRET');

    this.oauthClient = new google.auth.OAuth2(clientID, clientSecret);
  }

  async authenticate(token: string) {
    const tokenInfo = await this.oauthClient.getTokenInfo(token);

    const email = tokenInfo.email;

    try {
      const user = await this.userService.findByEmail(email);

      return this.handleRegisteredUser(user);
    } catch (error) {
      if (error.status !== 404) {
        throw new error();
      }

      return this.registerUser(token, email);
    }
  }

  async registerUser(token: string, email: string) {
    const userData = await this.getUserData(token);
    const name = userData.name;

    const user = await this.userService.createWithGoogle(email, name);

    return this.handleRegisteredUser(user);
  }

  async getCookiesForUser(user: UserEntity) {
    const { accessTokenCookie, refreshTokenCookie, accessTokenExpireDate } =
      await this.authenticationService.createAndSaveTokenPair(user.id);

    return {
      accessTokenCookie,
      refreshTokenCookie,
      accessTokenExpireDate,
    };
  }

  async handleRegisteredUser(user: UserEntity) {
    // if (!user.isRegisteredWithGoogle) {
    //   throw new UnauthorizedException();
    // }

    const { accessTokenCookie, refreshTokenCookie, accessTokenExpireDate } =
      await this.getCookiesForUser(user);

    return {
      accessTokenCookie,
      refreshTokenCookie,
      accessTokenExpireDate,
    };
  }

  async getUserData(token: string) {
    const userInfoClient = google.oauth2('v2').userinfo;

    this.oauthClient.setCredentials({
      access_token: token,
    });

    const userInfoResponse = await userInfoClient.get({
      auth: this.oauthClient,
    });

    return userInfoResponse.data;
  }
}
