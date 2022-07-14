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

@Injectable()
export class ConversationNewService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ActiveConversationEntity)
    private readonly activeConversationRepository: Repository<ActiveConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private cacheService: AuthCacheService,
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
    const conversationWithThisFriend = await this.getConversationWithFriend(
      friend.id,
    );
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
    const currentConversation = await this.getConversationWithFriend(friendId);
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
  }: {
    message: Message['message'];
    conversationId: Conversation['id'];
    creator: UserEntity;
  }): Promise<Message> {
    const conversation = await this.conversationRepository.findOne(
      conversationId,
    );

    return await this.messageRepository.save({
      user: creator,
      conversation,
      message,
    });
  }

  async getActiveUsers(
    conversationId: number,
  ): Promise<ObservedValueOf<Promise<ActiveConversationEntity[]>>> {
    return await this.activeConversationRepository.find({
      where: [{ conversationId }],
    });
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return await this.messageRepository
      .createQueryBuilder('message')
      .innerJoinAndSelect('message.user', 'user')
      .where('message.conversation.id =:conversationId', { conversationId })
      .orderBy('message.createdAt', 'ASC')
      .getMany();
  }

  async leaveConversation(socketId: string): Promise<DeleteResult> {
    return await this.activeConversationRepository.delete({ socketId });
  }
}
