import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { FilesService } from '../files/files.service';
import { Location } from '@app/location/location.entity';
import { LocationService } from '@app/location/location.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
    private readonly locationService: LocationService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userByUsername = await this.userRepository.findOne({
      username: createUserDto.username,
    });
    const userByEmail = await this.userRepository.findOne({
      email: createUserDto.email,
    });
    if (userByUsername || userByEmail) {
      throw new HttpException(
        'Email or username are taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    return await this.userRepository.save(newUser);
  }

  async createWithGoogle(email: string, name: string) {
    const newUser = {
      email,
      name,
      username: email,
      isRegisteredWithGoogle: true,
    };
    return await this.userRepository.save(newUser);
  }

  findById(id: number): Promise<UserEntity> {
    const user = this.userRepository.findOne(id);
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this id does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new HttpException(
        'User with this credentials does not exist',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  // buildUserResponse(user: UserEntity): UserResponseInterface {
  //   return {
  //     user: {
  //       ...user,
  //     },
  //   };
  // }

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  async getUsersForMap() {
    return await this.userRepository.find({
      select: ['avatar', 'id', 'location'],
      where: {
        location: Not(IsNull()),
      },
    });
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async addAvatar(userId: number, imageBuffer: Buffer, filename: string) {
    const user = await this.findById(userId);
    if (user.avatar) {
      await this.userRepository.update(userId, {
        ...user,
        avatar: null,
      });
      await this.filesService.deletePublicFile(user.avatar.id);
    }
    const avatar = await this.filesService.uploadPublicFile(
      imageBuffer,
      filename,
    );
    await this.userRepository.update(userId, {
      ...user,
      avatar: avatar,
    });
    return avatar;
  }

  async deleteAvatar(userId: number) {
    const user = await this.findById(userId);
    const fileId = user.avatar?.id;
    console.log('DEL_U', user);
    console.log('fileId', fileId);
    if (fileId) {
      await this.userRepository.update(userId, {
        ...user,
        avatar: null,
      });
      await this.filesService.deletePublicFile(fileId);
    }
  }

  async allowUserLocation(userId: number, userLocation: Omit<Location, 'id'>) {
    const user = await this.findById(userId);
    const location = await this.locationService.saveUserLocation(userLocation);

    return await this.userRepository.update(userId, {
      ...user,
      location: location,
    });
  }

  async disallowUserLocation(userId: number, userLocation) {
    const user = await this.findById(userId);

    await this.userRepository.update(userId, {
      ...user,
      location: null,
    });

    return await this.locationService.deleteLocation(userLocation.id);
  }
}
