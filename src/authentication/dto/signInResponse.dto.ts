import { ApiProperty } from '@nestjs/swagger';

export class SignInResponse {
  @ApiProperty()
  accessTokenExpireDate: Date;
}
