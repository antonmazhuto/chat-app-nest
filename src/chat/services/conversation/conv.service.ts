import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationEntity } from '@app/chat/conversation.entity';
import { DeleteResult, Repository } from 'typeorm';
import { ActiveConversationEntity } from '@app/chat/active-conversation.entity';
import { MessageEntity } from '@app/chat/message.entity';
import { Conversation } from '@app/chat/types/conversation.interface';
import { UserEntity } from '@app/user/user.entity';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { AuthCacheService } from '@app/authentication/cache/authCache.service';
import { ObservedValueOf } from 'rxjs';
import { Message } from '@app/chat/types/message.interface';
import { UploadEntity } from '@app/files/Upload.entity';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConversationNewService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ActiveConversationEntity)
    private readonly activeConversationRepository: Repository<ActiveConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(UploadEntity)
    private readonly uploadRepository: Repository<UploadEntity>,
    private cacheService: AuthCacheService,
    private readonly configService: ConfigService,
  ) {}

  async getUserFromSocket(socket: Socket): Promise<UserEntity> {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) {
      throw new WsException('Invalid credentials');
    }
    const { Authentication: authenticationToken } = parse(cookie);

    const user = await this.cacheService.getUserFromAuthenticationToken(
      authenticationToken,
    );
    if (!user) {
      throw new WsException('Invalid credentials');
    }
    return user;
  }

  async getAllConversations(creatorId: number): Promise<Conversation[]> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.users', 'u')
      .leftJoinAndSelect('conversation.users', 'user')
      .where('u.id = :creatorId', { creatorId })
      .orderBy('conversation.lastUpdated', 'DESC')
      .getMany();
  }

  async getUsersInConversation(
    conversationId: number,
  ): Promise<Conversation[]> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoinAndSelect('conversation.users', 'user')
      .where('conversation.id = :conversationId', { conversationId })
      .getMany();
  }

  async getConversationForCreation(
    creatorId: number,
    friendId: number,
  ): Promise<Conversation | undefined> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.users', 'user')
      .where('user.id = :creatorId', { creatorId })
      .orWhere('user.id = :friendId', { friendId })
      // .leftJoin('conversation.users', 'user')
      .getOne();
  }

  async getConversation(
    creatorId: number,
    friendId: number,
  ): Promise<Conversation | undefined> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.users', 'user')
      .where('user.id = :creatorId', { creatorId })
      .andWhere('user.id = :friendId', { friendId })
      // .leftJoin('conversation.users', 'user')
      .getOne();
  }

  async getConversationWithFriend(friendId: number) {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.users', 'user')
      .where('user.id = :friendId', { friendId })
      .getOne();
  }

  async createConversation({
    creator,
    friend,
  }: {
    creator: UserEntity;
    friend: UserEntity;
    creation?: boolean;
  }): Promise<Conversation> {
    const allConversations = await this.getAllConversations(creator.id);
    const conversationWithThisFriend = allConversations.find((s) =>
      s.users.some((u) => u.id === friend.id),
    );
    // const conversationWithThisFriend = await this.getConversationWithFriend(
    //   friend.id,
    // );
    const conversation = conversationWithThisFriend
      ? await this.getConversationForCreation(creator.id, friend.id)
      : await this.getConversation(creator.id, friend.id);
    const doesConversationExist = !!conversation;
    console.log('doesConversationExist', doesConversationExist);
    if (!doesConversationExist) {
      const newConversation: Conversation = {
        users: [creator, friend],
      };
      return await this.conversationRepository.save(newConversation);
    }
    return conversation;
  }

  async removeConversations() {
    await this.conversationRepository.createQueryBuilder().delete().execute();
  }

  async joinConversation(
    friendId: number,
    userId: number,
    socketId: string,
  ): Promise<ActiveConversationEntity> {
    const allConversations = await this.getAllConversations(userId);
    const currentConversation = allConversations.find((s) =>
      s.users.some((u) => u.id === friendId),
    );
    const activeConversation = await this.activeConversationRepository.findOne({
      userId,
    });

    if (activeConversation) {
      await this.activeConversationRepository.delete({
        userId,
      });
    }

    return await this.activeConversationRepository.save({
      socketId,
      userId,
      conversationId: currentConversation.id as number,
    });
  }

  async getActiveConversation(userId: number) {
    return await this.activeConversationRepository.findOne({
      userId,
    });
  }

  async createMessage({
    message,
    conversationId,
    creator,
    uploadId,
  }: {
    message: string;
    conversationId: Conversation['id'];
    creator: UserEntity;
    uploadId: UploadEntity['id'];
  }): Promise<Message> {
    const newMessage = new MessageEntity();
    if (uploadId) {
      newMessage.attachment = await this.uploadRepository.findOne(uploadId);
    }

    newMessage.user = creator;
    newMessage.message = message;
    newMessage.conversation = await this.conversationRepository.findOne(
      conversationId,
    );

    return await this.messageRepository.save(newMessage);
  }

  async getActiveUsers(
    conversationId: number,
  ): Promise<ObservedValueOf<Promise<ActiveConversationEntity[]>>> {
    return await this.activeConversationRepository.find({
      where: [{ conversationId }],
    });
  }

  async getMessages({
    conversationId,
    options,
  }: {
    conversationId: number;
    options: IPaginationOptions;
  }): Promise<{ messages: MessageEntity[]; count: number }> {
    const queryBuilder = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.attachment', 'att')
      .innerJoinAndSelect('message.user', 'user')
      .where('message.conversation.id =:conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC');

    const paginatedMessages = await paginate<MessageEntity>(
      queryBuilder,
      options,
    );
    return {
      messages: paginatedMessages.items.reverse(),
      count: paginatedMessages.meta.totalItems,
    };
  }

  async leaveConversation(socketId: string): Promise<DeleteResult> {
    return await this.activeConversationRepository.delete({ socketId });
  }

  async deleteMessage(messageId: number) {
    const message = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.attachment', 'att')
      .where('message.id = :messageId', { messageId })
      .getOne();
    const messageAttachment = message.attachment;
    console.log(messageAttachment);

    await this.uploadRepository.delete({ id: messageAttachment.id });

    await this.messageRepository.delete({ id: messageId });

    const s3 = new S3();
    for (const file of messageAttachment.files) {
      await s3
        .deleteObject({
          Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
          Key: file.key,
        })
        .promise();
    }

    // return await this.messageRepository.delete({ id: messageId });
  }
}
