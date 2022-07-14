import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UserResponseInterface } from './types/userResponse.interface';
import { UserEntity } from './user.entity';
import {
  ApiBody,
  ApiOkResponse,
  ApiTags,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { UserStrippedItemDto } from './dto/UserStrippedItemDto';
import { User } from './decorators/user.decorator';
import { AuthCacheService } from '../authentication/cache/authCache.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { PublicFileDto } from '@app/files/dto/publicFile.dto';
import { Location } from '@app/location/location.entity';

@Controller()
@ApiTags('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authCacheService: AuthCacheService,
  ) {}
  @Get('users')
  @ApiOkResponse({
    description: 'Get all users successfully',
    type: [UserEntity],
  })
  // @Public()
  async findAll(): Promise<UserEntity[]> {
    const users = await this.userService.findAll();
    return users;
  }

  @Get('users-for-map')
  @ApiOkResponse({
    description: 'Get all users for map successfully',
    type: [PickType(UserEntity, ['id', 'avatar', 'location'])],
  })
  async getUsersForMap() {
    return await this.userService.getUsersForMap();
  }

  @Post('users')
  @UsePipes(new ValidationPipe())
  @ApiOkResponse({
    description: 'User created successfully',
    type: UserEntity,
  })
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    return await this.userService.createUser(createUserDto);
  }

  @Get('user')
  @ApiOkResponse({
    description: 'Get user successfully',
    type: UserEntity,
  })
  async getCurrentUser(@Req() request): Promise<UserResponseInterface> {
    const userId = await this.authCacheService.getUserIdByAccessToken(
      request?.cookies.Authentication,
    );
    return await this.userService.findById(parseInt(userId));
  }

  @Put('user')
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserEntity,
  })
  @ApiBody({
    type: UpdateUserDto,
  })
  async updateCurrentUser(
    @User('id') currentUserId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    console.log('currentUserId', currentUserId);
    console.log('updateUserDto', updateUserDto);
    return await this.userService.updateUser(currentUserId, updateUserDto);
  }

  @Get('user/:id')
  async getUser(@Param('id') userId: string): Promise<UserEntity> {
    return this.userService.findById(parseInt(userId));
  }

  @Post('avatar')
  @ApiOkResponse({
    description: 'Avatar uploaded successfully',
    type: PublicFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(
    @User('id') currentUserId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.addAvatar(
      currentUserId,
      file.buffer,
      file.originalname,
    );
  }

  @Delete('avatar')
  @ApiOkResponse({
    description: 'Avatar deleted successfully',
  })
  async deleteAvatar(@User('id') currentUserId: number) {
    return this.userService.deleteAvatar(currentUserId);
  }

  @Post('allow-geolocation')
  @ApiOkResponse({
    description: 'User geolocation allowed successfully',
  })
  @ApiBody({
    type: OmitType(Location, ['id']),
  })
  async allowUserGeolocation(
    @User('id') currentUserId: number,
    @Body('location') userLocation: Location,
  ) {
    return this.userService.allowUserLocation(currentUserId, userLocation);
  }

  @Post('disallow-geolocation')
  @ApiOkResponse({
    description: 'User geolocation allowed successfully',
  })
  @ApiBody({
    type: OmitType(Location, ['id']),
  })
  async disallowUserGeolocation(
    @User('id') currentUserId: number,
    @Body('location') userLocation: Location,
  ) {
    console.log('LOC', userLocation);
    return this.userService.disallowUserLocation(currentUserId, userLocation);
  }
}
