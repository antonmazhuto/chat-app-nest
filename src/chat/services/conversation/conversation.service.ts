import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationEntity } from '@app/chat/conversation.entity';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import { ActiveConversationEntity } from '@app/chat/active-conversation.entity';
import { MessageEntity } from '@app/chat/message.entity';
import {
  from,
  mergeMap,
  Observable,
  ObservedValueOf,
  of,
  switchMap,
  take,
  map,
} from 'rxjs';
import { Conversation } from '@app/chat/types/conversation.interface';
import { UserEntity } from '@app/user/user.entity';
import { ActiveConversation } from '@app/chat/types/active-conversation.interface';
import { Message } from '@app/chat/types/message.interface';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ActiveConversationEntity)
    private readonly activeConversationRepository: Repository<ActiveConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  // async getConversation(
  //   creatorId: number,
  //   friendId: number,
  // ): Promise<Conversation | undefined> {
  //   return await this.conversationRepository
  //     .createQueryBuilder('conversation')
  //     .leftJoin('conversation.users', 'user')
  //     .where('user.id =:creatorId', { creatorId })
  //     .orWhere('user.id = :friendId', { friendId })
  //     .groupBy('conversation.id')
  //     .having('COUNT(*) > 1')
  //     .getOne();
  // }

  getAllConversations(creatorId: number): Observable<Conversation[]> {
    return from(
      this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin('conversation.users', 'user')
        .where('user.id =:creatorId', { creatorId })
        .groupBy('conversation.id')
        .getMany(),
    );
  }

  getConversation(
    creatorId: number,
    friendId: number,
  ): Observable<Conversation | undefined> {
    return from(
      this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin('conversation.users', 'user')
        .where('user.id =:creatorId', { creatorId })
        .orWhere('user.id = :friendId', { friendId })
        .groupBy('conversation.id')
        .having('COUNT(*) > 1')
        .getOne(),
    ).pipe(map((conversation: Conversation) => conversation || undefined));
  }

  // async createConversation(
  //   creator: UserEntity,
  //   friend: UserEntity,
  // ): Promise<Conversation> {
  //   const conversation = await this.getConversation(creator.id, friend.id);
  //   const doesConversationExist = !!conversation;
  //   console.log('doesConversationExist', doesConversationExist);
  //
  //   if (!doesConversationExist) {
  //     const newConversation: Conversation = {
  //       users: [creator, friend],
  //     };
  //     console.log('newConversation', newConversation);
  //     const conversation = await this.conversationRepository.save(
  //       newConversation,
  //     );
  //     console.log('saved_conversation', conversation);
  //     return conversation;
  //   }
  //   return conversation;
  // }
  createConversation(
    creator: UserEntity,
    friend: UserEntity,
  ): Observable<Conversation> {
    return this.getConversation(creator.id, friend.id).pipe(
      switchMap((conversation: Conversation) => {
        const doesConversationExist = !!conversation;

        if (!doesConversationExist) {
          const newConversation: Conversation = {
            users: [creator, friend],
          };
          return from(this.conversationRepository.save(newConversation));
        }
        return of(conversation);
      }),
    );
  }

  // getConversationsForUser(userId: number): Promise<Conversation[]> {
  //   return this.conversationRepository
  //     .createQueryBuilder('conversation')
  //     .leftJoin('conversation.users', 'user')
  //     .where('user.id = :userId', { userId })
  //     .orderBy('conversation.lastUpdated', 'DESC')
  //     .getMany();
  // }
  getConversationsForUser(userId: number): Observable<Conversation[]> {
    return from(
      this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin('conversation.users', 'user')
        .where('user.id = :userId', { userId })
        .orderBy('conversation.lastUpdated', 'DESC')
        .getMany(),
    );
  }

  // async getUsersInConversation(
  //   conversationId: number,
  // ): Promise<Conversation['users']> {
  //   const queryBuilder = await this.conversationRepository
  //     .createQueryBuilder('conversation')
  //     .innerJoinAndSelect('conversation.users', 'user')
  //     .where('conversation.id = :conversationId', { conversationId })
  //     .getMany();
  //
  //   return queryBuilder[0]['users'];
  //   // return this.conversationRepository
  //   //   .createQueryBuilder('conversation')
  //   //   .innerJoinAndSelect('conversation.users', 'user')
  //   //   .where('conversation.id = :conversationId', { conversationId });
  //   // .getMany()
  // }
  getUsersInConversation(conversationId: number): Observable<Conversation[]> {
    return from(
      this.conversationRepository
        .createQueryBuilder('conversation')
        .innerJoinAndSelect('conversation.users', 'user')
        .where('conversation.id = :conversationId', { conversationId })
        .getMany(),
    );
  }

  // async getConversationsWithUsers(userId: number): Promise<Conversation[]> {
  //   const userConversations = await this.getConversationsForUser(userId);
  //
  //   // const newConv = userConversations.forEach(async (conversation) => {
  //   //   const usrs = await this.getUsersInConversation(conversation.id);
  //   //   return {
  //   //     ...conversation,
  //   //     users: usrs,
  //   //   };
  //   // });
  //
  //   const newConv = userConversations.map(async (conversation) => ({
  //     ...conversation,
  //     users: await this.getUsersInConversation(conversation.id),
  //   }));
  //
  //   // const convWithUsers: Conversation[] = userConversations.reduce(
  //   //   async (prev, next) => {
  //   //     const users = await this.getUsersInConversation(next.id);
  //   //     return [...prev, { ...next, users }];
  //   //   },
  //   //   [],
  //   // );
  //   // userConversations.forEach(async (conversation) => {
  //   //   const users = await this.getUsersInConversation(conversation.id);
  //   //   conversation = Object.assign(conversation, { users });
  //   //   return conversation;
  //   // });
  //   console.log('userConversations', userConversations);
  //   return userConversations;
  //   // return this.getConversationsForUser(userId).pipe(
  //   //   take(1),
  //   //   switchMap((conversations: Conversation[]) => conversations),
  //   //   mergeMap((conversation: Conversation) => {
  //   //     return this.getUsersInConversation(conversation.id);
  //   //   }),
  //   // );
  // }
  getConversationsWithUsers(userId: number): Observable<Conversation[]> {
    return this.getConversationsForUser(userId).pipe(
      // take(1),
      switchMap((conversations: Conversation[]) => conversations),
      mergeMap((conversation: Conversation) => {
        return this.getUsersInConversation(conversation.id);
      }),
    );
  }

  joinConversation(
    friendId: number,
    userId: number,
    socketId: string,
  ): Observable<ActiveConversation> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.getConversation(userId, friendId).pipe(
      switchMap((conversation: Conversation) => {
        if (!conversation) {
          console.warn(
            `No conversation exists for userId: ${userId} and friendId: ${friendId}`,
          );
          return of();
        }
        const conversationId = conversation.id;
        return from(this.activeConversationRepository.findOne({ userId })).pipe(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          switchMap((activeConversation: ActiveConversation) => {
            if (activeConversation) {
              return from(
                this.activeConversationRepository.delete({ userId }),
              ).pipe(
                switchMap(() => {
                  return from(
                    this.activeConversationRepository.save({
                      socketId,
                      userId,
                      conversationId,
                    }),
                  );
                }),
              );
            } else {
              return from(
                this.activeConversationRepository.save({
                  socketId,
                  userId,
                  conversationId,
                }),
              );
            }
          }),
        );
      }),
    );
  }

  leaveConversation(socketId: string): Observable<DeleteResult> {
    return from(this.activeConversationRepository.delete({ socketId }));
  }

  getActiveUsers(
    conversationId: number,
  ): Observable<ObservedValueOf<Promise<ActiveConversationEntity[]>>> {
    return from(
      this.activeConversationRepository.find({
        where: [{ conversationId }],
      }),
    );
  }

  createMessage(message: Message): Observable<Message> {
    return from(this.messageRepository.save(message));
  }

  getMessages(conversationId: number): Observable<Message[]> {
    return from(
      this.messageRepository
        .createQueryBuilder('message')
        .innerJoinAndSelect('message.user', 'user')
        .where('message.conversation.id =:conversationId', { conversationId })
        .orderBy('message.createdAt', 'ASC')
        .getMany(),
    );
  }

  // Note: Would remove below in production - helper methods
  removeActiveConversations() {
    return from(
      this.activeConversationRepository.createQueryBuilder().delete().execute(),
    );
  }

  removeMessages() {
    return from(this.messageRepository.createQueryBuilder().delete().execute());
  }

  removeConversations() {
    return from(
      this.conversationRepository.createQueryBuilder().delete().execute(),
    );
  }
}
