import {
  Controller,
  Post,
  UseGuards,
  Res,
  UsePipes,
  ValidationPipe,
  Body,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { UserEntity } from '../user/user.entity';
import { CredentialsAuthenticateGuard } from './guards/credentialsAuthenticate.guard';
import { User } from '../user/decorators/user.decorator';
import { SignUpUserDto } from './dto/signUp.dto';
import { Public } from '../decorators/public.decorators';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { AuthCacheService } from './cache/authCache.service';
import { ApiBody, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignInUserDto } from './dto/signIn.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { SignInResponse } from './dto/signInResponse.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authCacheService: AuthCacheService,
  ) {}

  @Post('sign-up')
  @ApiBody({ type: SignUpUserDto })
  @Public()
  @UsePipes(new ValidationPipe())
  async signUp(@Body('user') signUpData: SignUpUserDto) {
    return this.authenticationService.signUp(signUpData);
  }

  @Post('sign-in')
  @ApiOkResponse({
    description: 'Sign In successfully',
    type: SignInResponse,
  })
  @ApiBody({ type: SignInUserDto })
  @Public()
  @HttpCode(200)
  @UseGuards(CredentialsAuthenticateGuard)
  async signIn(
    @User() currentUser: UserEntity,
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const { accessTokenCookie, refreshTokenCookie, accessTokenExpireDate } =
      await this.authenticationService.createAndSaveTokenPair(currentUser.id);

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);

    return { accessTokenExpireDate }; // на стороне клиента выполнять рефреш незадолго до экспирации, для чего потребуется знать время жизни
  }

  @ApiResponse({
    description: 'Log Out successfully',
    status: 204,
  })
  @Post('log-out')
  @HttpCode(204)
  async logout(@Req() request: any, @Res({ passthrough: true }) response: any) {
    const userId = await this.authCacheService.getUserIdByAccessToken(
      request?.cookies.Authentication,
    );
    const { accessTokenCookie, refreshTokenCookie } =
      await this.authenticationService.logout(parseInt(userId));

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);
    return { success: true };
  }

  @Post('refresh-token')
  @ApiResponse({
    description: 'Tokens refreshed successfully',
    type: RefreshTokenDto,
    status: 200,
  })
  @HttpCode(200)
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @User() currentUser: UserEntity,
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const { accessTokenCookie, refreshTokenCookie, accessTokenExpireDate } =
      await this.authenticationService.createAndSaveTokenPair(currentUser.id);

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);

    return { accessTokenExpireDate }; // на стороне клиента выполнять рефреш незадолго до экспирации, для чего потребуется знать время жизни
  }
}
