import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { compare } from 'bcrypt';

@Injectable()
export class CredentialsAuthenticateGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { email, password } = request.body;

    const user = await this.userService.findByEmail(email);

    const isPasswordCorrect = await compare(password, user.password);

    if (!user || !isPasswordCorrect)
      throw new HttpException(
        'Credentials are note valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

    request.user = user;

    return true;
  }
}
