import { ApiProperty } from '@nestjs/swagger';
import { PublicFile } from '@app/files/publicFile.entity';
import { IsNullable } from '@app/common/utils/is-nullable.decorator';

export class UpdateUserDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  @IsNullable()
  avatar?: PublicFile;
}
