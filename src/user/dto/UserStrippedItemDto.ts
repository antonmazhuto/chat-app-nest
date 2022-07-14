import { ApiProperty } from '@nestjs/swagger';

export class UserStrippedItemDto<TData> {
  @ApiProperty()
  id: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
}
