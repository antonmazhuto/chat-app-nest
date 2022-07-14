import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: "User's username",
    default: 'mazhutoanton',
  })
  @IsNotEmpty()
  readonly username: string;

  @ApiProperty({
    description: "User's email",
    default: 'mazhutoa@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    description: "User's password",
    default: '',
  })
  @IsNotEmpty()
  readonly password: string;
}
