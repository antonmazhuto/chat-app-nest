import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';
import { AuthCacheService } from '@app/authentication/cache/authCache.service';
import { UserEntity } from '@app/user/user.entity';
import { Message } from '@app/chat/types/message.interface';
import { ConversationNewService } from '@app/chat/services/conversation/conv.service';
import { Conversation } from '@app/chat/types/conversation.interface';
import { FileDto } from '@app/user/dto/file.dto';
import { UploadEntity } from '@app/files/Upload.entity';
import { PaginationParams } from '@app/common/paginations-params';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

@WebSocketGateway({
  cors: { origin: ['http://localhost:3001'], credentials: true },
  namespace: '/chat',
  transports: ['websocket'],
})
export class ChatGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  constructor(
    private cacheService: AuthCacheService,
    private conversationService: ConversationNewService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('Initialized!');
  }

  async onModuleInit() {
    // await this.conversationService.removeConversations();
  }

  async handleConnection(socket: Socket) {
    console.log('HANDLE CONNECTION');

    const user = await this.conversationService.getUserFromSocket(socket);
    socket.data.user = user;
    await this.getConversations(socket, user.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('HANDLE DISCONNECT');
  }

  async getConversations(socket: Socket, userId: number) {
    const conversations = await this.conversationService.getAllConversations(
      userId,
    );
    return this.server.to(socket.id).emit('allConversations', conversations);
  }

  async getLastActiveConversation(socket: Socket, userId: number) {
    await this.conversationService
      .getActiveConversation(userId)
      .then((activeConversation) => {
        this.server
          .to(socket.id)
          .emit('activeConversation', activeConversation);
      });
  }

  @SubscribeMessage('createConversation')
  async createConversation(socket: Socket, friend: UserEntity) {
    const author = await this.conversationService.getUserFromSocket(socket);
    await this.conversationService
      .createConversation({ creator: author, friend })
      .then(() => {
        this.getConversations(socket, socket.data.user.id);
        this.conversationService.joinConversation(
          friend.id,
          author.id,
          socket.id,
        );
      });

    await this.joinConversation(socket, { friendId: friend.id });
  }

  @SubscribeMessage('joinConversation')
  async joinConversation(
    socket: Socket,
    data: {
      friendId: number;
      // options?: IPaginationOptions;
    },
  ) {
    const { friendId } = data;
    const author = await this.conversationService.getUserFromSocket(socket);
    await this.conversationService
      .joinConversation(friendId, author.id, socket.id)
      .then((activeConversation) => {
        this.conversationService
          .getMessages({
            conversationId: activeConversation.conversationId,
            options: {
              page: 1,
              limit: 4,
            },
          })
          .then((messages) => {
            this.server.to(socket.id).emit('messages', messages);
          });
      });

    await this.conversationService
      .getActiveConversation(author.id)
      .then((activeConversation) => {
        this.server
          .to(socket.id)
          .emit('activeConversation', activeConversation);
      });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    socket: Socket,
    data: {
      conversationId: Conversation['id'];
      message: string;
      uploadId: UploadEntity['id'];
    },
  ) {
    const { conversationId, message, uploadId } = data;

    if (!conversationId) return null;

    const creator = await this.conversationService.getUserFromSocket(socket);

    const savedMessage = await this.conversationService.createMessage({
      message,
      conversationId,
      creator,
      uploadId,
    });

    const activeConversations = await this.conversationService.getActiveUsers(
      conversationId,
    );

    activeConversations.forEach((activeConversation) => {
      this.server
        .to(activeConversation.socketId)
        .emit('newMessage', savedMessage);
    });
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(socket: Socket, messageId: number) {
    await this.conversationService.deleteMessage(messageId);

    const author = await this.conversationService.getUserFromSocket(socket);

    await this.conversationService
      .getActiveConversation(author.id)
      .then((activeConversation) => {
        this.conversationService
          .getMessages({
            conversationId: activeConversation.conversationId,
            options: {
              page: 1,
              limit: 4,
            },
          })
          .then((messages) => {
            this.server.to(socket.id).emit('messages', messages);
          });
      });
  }

  @SubscribeMessage('leaveConversation')
  async leaveConversation(socket: Socket) {
    const author = await this.conversationService.getUserFromSocket(socket);
    await this.conversationService.leaveConversation(socket.id);
    await this.conversationService
      .getActiveConversation(author.id)
      .then((activeConversation) => {
        this.server
          .to(socket.id)
          .emit('activeConversation', activeConversation);
      });
  }
}
