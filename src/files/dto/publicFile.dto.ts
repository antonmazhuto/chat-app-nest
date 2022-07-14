import { ApiProperty } from '@nestjs/swagger';

export class PublicFileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;
}
